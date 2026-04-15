"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  fileName: string | null;
  analyserNode: AnalyserNode | null;
  /** 0–1, mirrors HTMLMediaElement.volume */
  volume: number;
}

export interface AudioEngineControls {
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  /**
   * Sets HTMLMediaElement.volume only (no React state). Use while dragging a slider;
   * call commitVolumeFromElement when the gesture ends to sync context once.
   */
  applyVolumeImmediate: (volume: number) => void;
  /** Pushes the current audio element volume into React state (call after drag ends). */
  commitVolumeFromElement: () => void;
  loadFile: (file: File) => Promise<void>;
  loadUrl: (url: string) => Promise<void>;
}

export type AudioEngine = AudioEngineState & AudioEngineControls;

const ANALYSER_FFT_SIZE = 2048;

export function useAudioEngine(): AudioEngine {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  /** Skips syncing volume into React when applyVolumeImmediate triggered volumechange. */
  const skipVolumeStateFromImmediateRef = useRef(false);

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    fileName: null,
    analyserNode: null,
    volume: 1,
  });

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setState((prev) => ({ ...prev, analyserNode: analyser }));
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return {
      context: audioContextRef.current,
      analyser: analyserRef.current!,
    };
  }, []);

  const ensureAudioElement = useCallback(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.crossOrigin = "anonymous";
    }
    return audioElementRef.current;
  }, []);

  const connectSource = useCallback(() => {
    const element = audioElementRef.current;
    const { context, analyser } = ensureAudioContext();

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    const source = context.createMediaElementSource(element!);
    source.connect(analyser);
    sourceRef.current = source;
  }, [ensureAudioContext]);

  const bindEvents = useCallback((element: HTMLAudioElement) => {
    const onTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: element.currentTime }));
    };
    const onDurationChange = () => {
      setState((prev) => ({ ...prev, duration: element.duration || 0 }));
    };
    const onPlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };
    const onPause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };
    const onEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };
    const onVolumeChange = () => {
      if (skipVolumeStateFromImmediateRef.current) return;
      setState((prev) => ({ ...prev, volume: element.volume }));
    };

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("durationchange", onDurationChange);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onEnded);
    element.addEventListener("volumechange", onVolumeChange);

    return () => {
      element.removeEventListener("timeupdate", onTimeUpdate);
      element.removeEventListener("durationchange", onDurationChange);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  useEffect(() => {
    const element = ensureAudioElement();
    setState((prev) => ({ ...prev, volume: element.volume }));
    const unbind = bindEvents(element);

    return () => {
      unbind();
      element.pause();
      element.src = "";

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, [ensureAudioElement, bindEvents]);

  const waitForCanPlay = useCallback((element: HTMLAudioElement) => {
    return new Promise<void>((resolve) => {
      if (element.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        resolve();
        return;
      }
      const onReady = () => {
        element.removeEventListener("canplay", onReady);
        element.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        element.removeEventListener("canplay", onReady);
        element.removeEventListener("error", onError);
        resolve();
      };
      element.addEventListener("canplay", onReady);
      element.addEventListener("error", onError);
    });
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const element = ensureAudioElement();
      element.pause();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      if (!sourceRef.current) {
        connectSource();
      }

      element.src = url;
      element.load();
      await waitForCanPlay(element);

      setState((prev) => ({
        ...prev,
        isLoaded: true,
        fileName: file.name,
        currentTime: 0,
      }));
    },
    [ensureAudioElement, connectSource, waitForCanPlay],
  );

  const loadUrl = useCallback(
    async (url: string) => {
      const element = ensureAudioElement();
      element.pause();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      if (!sourceRef.current) {
        connectSource();
      }

      element.src = url;
      element.load();
      await waitForCanPlay(element);

      setState((prev) => ({
        ...prev,
        isLoaded: true,
        fileName: url.split("/").pop() || null,
        currentTime: 0,
      }));
    },
    [ensureAudioElement, connectSource, waitForCanPlay],
  );

  const play = useCallback(async () => {
    ensureAudioContext();
    await audioElementRef.current?.play();
  }, [ensureAudioContext]);

  const pause = useCallback(() => {
    audioElementRef.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    if (audioElementRef.current?.paused) {
      await play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  const applyVolumeImmediate = useCallback((volume: number) => {
    const element = audioElementRef.current;
    if (!element) return;
    const clamped = Math.min(1, Math.max(0, volume));
    skipVolumeStateFromImmediateRef.current = true;
    element.volume = clamped;
    queueMicrotask(() => {
      skipVolumeStateFromImmediateRef.current = false;
    });
  }, []);

  const commitVolumeFromElement = useCallback(() => {
    const element = audioElementRef.current;
    if (!element) return;
    setState((prev) =>
      prev.volume === element.volume
        ? prev
        : { ...prev, volume: element.volume },
    );
  }, []);

  const setVolume = useCallback((volume: number) => {
    const element = audioElementRef.current;
    if (!element) return;
    const clamped = Math.min(1, Math.max(0, volume));
    element.volume = clamped;
    // volumechange syncs React state (skipped only during applyVolumeImmediate)
  }, []);

  return {
    ...state,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    applyVolumeImmediate,
    commitVolumeFromElement,
    loadFile,
    loadUrl,
  };
}
