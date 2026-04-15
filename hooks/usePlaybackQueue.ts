"use client";

import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAudioFile } from "@/components/audio/audio-file.constants";
import {
  DoublyLinkedPlaylist,
  cloneTrackEntryForQueue,
  createCatalogTrackEntry,
  createFileTrackEntry,
  libraryHasDisplayNameCollision,
  sourcesMatch,
  type TrackEntry,
} from "@/lib/playback-queue";

export interface UsePlaybackQueueArgs {
  loadFile: (file: File) => Promise<void>;
  loadUrl: (url: string) => Promise<void>;
  play: () => Promise<void>;
  /** Clears loaded media when the current queue track is removed and the queue is emptied. */
  clearPlayback: () => void;
  /** Wired from `useAudioEngine` so the queue can auto-advance. */
  mediaEndedRef: MutableRefObject<(() => void) | null>;
  /** When false, defers `GET /api/music` bootstrap until true (e.g. after onboarding). */
  catalogBootstrapEnabled?: boolean;
}

export interface PlaybackQueueApi {
  queueVersion: number;
  /** Current track and all upcoming entries (now playing + rest of queue). */
  queueSnapshot: TrackEntry[];
  /** Queue entry id currently loaded for playback, if any. */
  currentTrackId: string | null;
  /** Catalog + session uploads (API tracks are replaced on each successful bootstrap). */
  library: TrackEntry[];
  addLibraryFile: (file: File) => void;
  /** Adds every valid, non-duplicate file in one update (batch picker / multi-drop). */
  addLibraryFiles: (files: FileList | readonly File[]) => void;
  /**
   * Removes a track from the library and every queue row that plays the same
   * source (including the current track, then reloads or clears playback).
   */
  removeLibraryEntry: (libraryEntryId: string) => Promise<void>;
  /** Appends a clone of the library entry to the playback queue. */
  addLibraryEntryToQueue: (libraryEntryId: string) => Promise<void>;
  /**
   * Appends a clone, then moves it before `beforeQueueId` when provided (insert at position).
   * Omit `beforeQueueId` to append at tail.
   */
  addLibraryEntryToQueueAt: (
    libraryEntryId: string,
    beforeQueueId?: string,
  ) => Promise<void>;
  /**
   * Jumps the queue cursor to a node matching this library source, or appends a clone
   * and selects it, then loads and plays.
   */
  playLibraryEntry: (libraryEntryId: string) => Promise<void>;
  /** Selects this queue entry as current, loads, and plays. */
  playQueueEntry: (queueEntryId: string) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  moveBefore: (sourceId: string, beforeId: string) => void;
  moveAfter: (sourceId: string, afterId: string) => void;
}

function logQueueState(reason: string, playlist: DoublyLinkedPlaylist) {
  console.log(`[playback-queue] ${reason}`, {
    order: playlist.toOrderedLabels(),
    currentId: playlist.currentId(),
    currentLabel: playlist.currentLabel(),
  });
}

export function usePlaybackQueue({
  loadFile,
  loadUrl,
  play,
  clearPlayback,
  mediaEndedRef,
  catalogBootstrapEnabled = true,
}: UsePlaybackQueueArgs): PlaybackQueueApi {
  const playlistRef = useRef(new DoublyLinkedPlaylist());
  const [queueVersion, setQueueVersion] = useState(0);
  const [library, setLibrary] = useState<TrackEntry[]>([]);
  const libraryRef = useRef<TrackEntry[]>([]);

  const bump = useCallback(() => {
    setQueueVersion((v) => v + 1);
  }, []);

  const setLibraryAndRef = useCallback((next: TrackEntry[]) => {
    libraryRef.current = next;
    setLibrary(next);
  }, []);

  const queueSnapshot = useMemo(() => {
    return playlistRef.current.toOrderedEntriesFromCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref snapshot when queue mutates
  }, [queueVersion]);

  const currentTrackId = useMemo(() => {
    return playlistRef.current.currentId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueVersion]);

  const loadActiveTrack = useCallback(async () => {
    const cur = playlistRef.current.current;
    if (!cur) return;
    const src = cur.entry.source;
    if (src.kind === "file") {
      await loadFile(src.file);
    } else {
      await loadUrl(src.url);
    }
  }, [loadFile, loadUrl]);

  const addLibraryFiles = useCallback((files: FileList | readonly File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setLibrary((prev) => {
      let next = [...prev];
      for (const file of list) {
        if (!isAudioFile(file)) continue;
        if (libraryHasDisplayNameCollision(next, file.name)) continue;
        next = [...next, createFileTrackEntry(file)];
      }
      libraryRef.current = next;
      return next;
    });
  }, []);

  const addLibraryFile = useCallback(
    (file: File) => {
      addLibraryFiles([file]);
    },
    [addLibraryFiles],
  );

  const removeLibraryEntry = useCallback(
    async (libraryEntryId: string) => {
      const removed = libraryRef.current.find((e) => e.id === libraryEntryId);
      if (!removed) return;

      setLibrary((prev) => {
        const next = prev.filter((e) => e.id !== libraryEntryId);
        libraryRef.current = next;
        return next;
      });

      const playlist = playlistRef.current;
      const prevCurrentId = playlist.currentId();

      const idsToRemove: string[] = [];
      let n = playlist.head;
      while (n) {
        if (sourcesMatch(n.entry, removed)) {
          idsToRemove.push(n.entry.id);
        }
        n = n.next;
      }

      if (idsToRemove.length === 0) return;

      for (const id of idsToRemove) {
        playlist.removeById(id);
      }
      bump();
      logQueueState("removeLibraryEntry", playlist);

      if (playlist.isEmpty()) {
        clearPlayback();
        return;
      }

      const newCurrentId = playlist.currentId();
      if (prevCurrentId !== newCurrentId) {
        await loadActiveTrack();
        await play();
      }
    },
    [bump, clearPlayback, loadActiveTrack, play],
  );

  const addLibraryEntryToQueue = useCallback(
    async (libraryEntryId: string) => {
      const entry = libraryRef.current.find((e) => e.id === libraryEntryId);
      if (!entry) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[playback-queue] addLibraryEntryToQueue: missing library entry",
            libraryEntryId,
          );
        }
        return;
      }

      const playlist = playlistRef.current;
      const wasEmpty = playlist.isEmpty();
      playlist.appendEntry(cloneTrackEntryForQueue(entry));
      bump();
      logQueueState("addLibraryEntryToQueue", playlist);
      if (wasEmpty) {
        await loadActiveTrack();
      }
    },
    [bump, loadActiveTrack],
  );

  const addLibraryEntryToQueueAt = useCallback(
    async (libraryEntryId: string, beforeQueueId?: string) => {
      const entry = libraryRef.current.find((e) => e.id === libraryEntryId);
      if (!entry) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[playback-queue] addLibraryEntryToQueueAt: missing library entry",
            libraryEntryId,
          );
        }
        return;
      }

      const playlist = playlistRef.current;
      const wasEmpty = playlist.isEmpty();
      const node = playlist.appendEntry(cloneTrackEntryForQueue(entry));
      const newId = node.entry.id;

      if (
        beforeQueueId &&
        beforeQueueId !== newId &&
        playlist.findNodeById(beforeQueueId)
      ) {
        playlist.moveBefore(newId, beforeQueueId);
      }

      bump();
      logQueueState("addLibraryEntryToQueueAt", playlist);
      if (wasEmpty) {
        await loadActiveTrack();
      }
    },
    [bump, loadActiveTrack],
  );

  const playLibraryEntry = useCallback(
    async (libraryEntryId: string) => {
      const entry = libraryRef.current.find((e) => e.id === libraryEntryId);
      if (!entry) return;

      const playlist = playlistRef.current;
      const matched = playlist.selectBySourceMatch(entry);
      if (!matched) {
        const wasEmpty = playlist.isEmpty();
        const node = playlist.appendEntry(cloneTrackEntryForQueue(entry));
        if (!wasEmpty) {
          playlist.current = node;
        }
      }
      bump();
      logQueueState("playLibraryEntry", playlist);
      await loadActiveTrack();
      await play();
    },
    [bump, loadActiveTrack, play],
  );

  /**
   * Advances the playhead step-by-step until `queueEntryId` is current (skips
   * intermediate tracks as if next was pressed), then loads and plays.
   */
  const playQueueEntry = useCallback(
    async (queueEntryId: string) => {
      const playlist = playlistRef.current;
      const fromCurrent = playlist.toOrderedEntriesFromCurrent();
      const idx = fromCurrent.findIndex((e) => e.id === queueEntryId);
      if (idx === -1) return;

      for (let i = 0; i < idx; i++) {
        if (!playlist.advanceCurrent()) return;
      }

      bump();
      logQueueState("playQueueEntry", playlist);
      await loadActiveTrack();
      await play();
    },
    [bump, loadActiveTrack, play],
  );

  const skipToNext = useCallback(async () => {
    const playlist = playlistRef.current;
    if (!playlist.advanceCurrent()) return;
    bump();
    logQueueState("skipToNext", playlist);
    await loadActiveTrack();
    await play();
  }, [bump, loadActiveTrack, play]);

  const skipToPrevious = useCallback(async () => {
    const playlist = playlistRef.current;
    if (!playlist.retreatCurrent()) return;
    bump();
    logQueueState("skipToPrevious", playlist);
    await loadActiveTrack();
    await play();
  }, [bump, loadActiveTrack, play]);

  const removeTrack = useCallback(
    async (id: string) => {
      const playlist = playlistRef.current;
      const prevCurrentId = playlist.currentId();
      if (prevCurrentId === id) {
        playlist.clear();
        bump();
        logQueueState("removeTrack (cleared queue — removed current)", playlist);
        clearPlayback();
        return;
      }
      if (!playlist.removeById(id)) return;
      bump();
      logQueueState("removeTrack", playlist);
    },
    [bump, clearPlayback],
  );

  const moveBefore = useCallback(
    (sourceId: string, beforeId: string) => {
      const playlist = playlistRef.current;
      if (!playlist.moveBefore(sourceId, beforeId)) return;
      bump();
      logQueueState("moveBefore", playlist);
    },
    [bump],
  );

  const moveAfter = useCallback(
    (sourceId: string, afterId: string) => {
      const playlist = playlistRef.current;
      if (!playlist.moveAfter(sourceId, afterId)) return;
      bump();
      logQueueState("moveAfter", playlist);
    },
    [bump],
  );

  const handleMediaEnded = useCallback(async () => {
    const playlist = playlistRef.current;
    if (!playlist.advanceCurrent()) {
      logQueueState("ended (no next)", playlist);
      return;
    }
    bump();
    logQueueState("auto-advance on ended", playlist);
    await loadActiveTrack();
    await play();
  }, [bump, loadActiveTrack, play]);

  useEffect(() => {
    mediaEndedRef.current = () => {
      void handleMediaEnded();
    };
    return () => {
      mediaEndedRef.current = null;
    };
  }, [handleMediaEnded, mediaEndedRef]);

  useEffect(() => {
    if (!catalogBootstrapEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/music");
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as {
          tracks?: { url: string; label: string }[];
        };
        const tracks = data.tracks ?? [];
        if (cancelled) return;

        const catalogEntries = tracks.map((t) =>
          createCatalogTrackEntry(t.url, t.label),
        );

        const uploads = libraryRef.current.filter((e) => e.source.kind === "file");
        setLibraryAndRef([...catalogEntries, ...uploads]);

        const playlist = new DoublyLinkedPlaylist();
        playlistRef.current = playlist;
        for (const e of catalogEntries) {
          playlist.appendEntry(cloneTrackEntryForQueue(e));
        }
        bump();
        logQueueState("bootstrap from /api/music", playlist);

        if (!playlist.isEmpty()) {
          await loadActiveTrack();
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap when catalog load is enabled
  }, [catalogBootstrapEnabled]);

  return {
    queueVersion,
    queueSnapshot,
    currentTrackId,
    library,
    addLibraryFile,
    addLibraryFiles,
    removeLibraryEntry,
    addLibraryEntryToQueue,
    addLibraryEntryToQueueAt,
    playLibraryEntry,
    playQueueEntry,
    skipToNext,
    skipToPrevious,
    removeTrack,
    moveBefore,
    moveAfter,
  };
}
