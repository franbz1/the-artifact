"use client";

import { useCallback, useRef } from "react";
import { ControlStrip } from "@/components/player/ControlStrip";
import { ArtifactVolumeControl } from "@/components/player/ArtifactVolumeControl";
import {
  FIXED_VOLUME_TRACK_HEIGHT_PX,
  TRACK_TITLE_CORNER_MAX_REM,
} from "@/components/player/control-strip.constants";
import { TrackTitleTrim } from "@/components/player/TrackTitleTrim";
import { useDocumentAudioDrop } from "@/hooks/useDocumentAudioDrop";
import { cn } from "@/lib/utils";
import { useAudio } from "./AudioProvider";
import { ACCEPTED_INPUT, isAudioFile } from "./audio-file.constants";

/**
 * Document-level file drop + hidden file input + control strip.
 */
export function AudioChrome() {
  const { loadFile, play, fileName, isLoaded } = useAudio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndPlay = useCallback(
    async (file: File) => {
      await loadFile(file);
      await play();
    },
    [loadFile, play],
  );

  const onDropFile = useCallback(
    async (file: File) => {
      if (!isAudioFile(file)) return;
      await loadAndPlay(file);
    },
    [loadAndPlay],
  );

  const { isDragOver } = useDocumentAudioDrop({ onDropFile });

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isAudioFile(file)) {
        await loadAndPlay(file);
      }
      e.target.value = "";
    },
    [loadAndPlay],
  );

  const onOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      {isDragOver && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center border border-lunar/20 bg-lunar/[0.03]">
          <span className="text-inscription text-membrane-dim">
            Release to awaken
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_INPUT}
        onChange={onFileChange}
        className="hidden"
        aria-hidden
      />

      {fileName ? (
        <div
          className="pointer-events-none fixed left-4 top-4 z-50 md:left-8 md:top-5"
          aria-live="polite"
        >
          <TrackTitleTrim
            text={fileName}
            align="start"
            maxWidthRem={TRACK_TITLE_CORNER_MAX_REM}
            className="text-membrane-dim/80"
          />
        </div>
      ) : null}

      {isLoaded ? (
        <div
          className={cn(
            "fixed left-4 z-50 md:left-8",
            "pointer-events-auto opacity-0 transition-opacity duration-300 ease-[var(--ease-awareness)]",
            "hover:opacity-100 has-[input:focus-visible]:opacity-100",
            "top-[calc(env(safe-area-inset-top,0px)+9rem)] md:top-[calc(env(safe-area-inset-top,0px)+9rem)]",
          )}
          style={{ height: FIXED_VOLUME_TRACK_HEIGHT_PX }}
        >
          <ArtifactVolumeControl
            trackLengthPx={FIXED_VOLUME_TRACK_HEIGHT_PX}
            className="h-full justify-center py-0"
          />
        </div>
      ) : null}

      <ControlStrip onOpenFile={onOpenFile} />
    </>
  );
}
