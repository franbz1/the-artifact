"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ControlStrip } from "@/components/player/ControlStrip";
import { ArtifactVolumeControl } from "@/components/player/ArtifactVolumeControl";
import {
  FIXED_VOLUME_TRACK_HEIGHT_PX,
  TRACK_TITLE_CORNER_MAX_REM,
} from "@/components/player/control-strip.constants";
import { ARTIFACT_ZONE_CENTER_Y_CLASS } from "@/components/visualizer/visualizer.constants";
import { TrackTitleTrim } from "@/components/player/TrackTitleTrim";
import { useDocumentAudioDrop } from "@/hooks/useDocumentAudioDrop";
import { cn } from "@/lib/utils";
import { useAudio } from "./AudioProvider";
import { ACCEPTED_INPUT } from "./audio-file.constants";

function GlyphVolume() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 text-membrane-dim"
      aria-hidden
    >
      <path
        d="M11 5 6 9H4v6h2l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9.5c.6.7.9 1.5.9 2.5s-.3 1.8-.9 2.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface AudioChromeProps {
  isMobile?: boolean;
  onOpenLibrary?: () => void;
  onOpenQueue?: () => void;
}

/**
 * Document-level file drop + hidden file input + control strip.
 */
export function AudioChrome({
  isMobile = false,
  onOpenLibrary,
  onOpenQueue,
}: AudioChromeProps) {
  const { addLibraryFiles, fileName, isLoaded } = useAudio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileVolumeOpen, setMobileVolumeOpen] = useState(false);
  const mobileVolRef = useRef<HTMLDivElement>(null);

  const onDropFiles = useCallback(
    (files: File[]) => {
      addLibraryFiles(files);
    },
    [addLibraryFiles],
  );

  const { isDragOver } = useDocumentAudioDrop({ onDropFiles });

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) {
        addLibraryFiles(files);
      }
      e.target.value = "";
    },
    [addLibraryFiles],
  );

  const onOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    if (!mobileVolumeOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = mobileVolRef.current;
      if (!el?.contains(e.target as Node)) {
        setMobileVolumeOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [mobileVolumeOpen]);

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
        multiple
        onChange={onFileChange}
        className="hidden"
        aria-hidden
      />

      <div
        className="pointer-events-none fixed left-4 top-4 z-50 md:left-8 md:top-5"
        aria-live="polite"
      >
        <TrackTitleTrim
          text={fileName ?? "No track"}
          align="start"
          maxWidthRem={
            isMobile ? Math.min(18, TRACK_TITLE_CORNER_MAX_REM) : TRACK_TITLE_CORNER_MAX_REM
          }
          className={
            fileName ? "text-membrane-dim/80" : "text-membrane-dim/55"
          }
        />
      </div>

      {isLoaded && !isMobile ? (
        <div
          className={cn(
            "fixed left-4 z-50 md:left-8",
            "pointer-events-auto opacity-0 transition-opacity duration-300 ease-[var(--ease-awareness)]",
            "hover:opacity-100 has-[input:focus-visible]:opacity-100",
            ARTIFACT_ZONE_CENTER_Y_CLASS,
          )}
          style={{ height: FIXED_VOLUME_TRACK_HEIGHT_PX }}
        >
          <ArtifactVolumeControl
            trackLengthPx={FIXED_VOLUME_TRACK_HEIGHT_PX}
            className="h-full justify-center py-0"
          />
        </div>
      ) : null}

      {isLoaded && isMobile ? (
        <div
          ref={mobileVolRef}
          className={cn(
            "fixed left-4 z-[48] flex flex-col items-start gap-2",
            "bottom-[max(10rem,calc(6rem+env(safe-area-inset-bottom,0px)))]",
          )}
        >
          <button
            type="button"
            aria-expanded={mobileVolumeOpen}
            aria-controls="artifact-volume-popover"
            onClick={() => setMobileVolumeOpen((v) => !v)}
            className={cn(
              "interact-aware flex h-10 w-10 items-center justify-center rounded-worn border border-border-faint/80 bg-surface-overlay/90 shadow-depth backdrop-blur-sm outline-none",
              "focus-visible:ring-1 focus-visible:ring-lunar/50",
            )}
          >
            <GlyphVolume />
            <span className="sr-only">Volume</span>
          </button>
          {mobileVolumeOpen ? (
            <div
              id="artifact-volume-popover"
              className={cn(
                "w-[min(calc(100vw-2rem),14rem)] rounded-worn border border-border-faint/80 bg-surface-overlay/95 px-breath py-grain shadow-depth backdrop-blur-md",
                "[animation:var(--animate-dissolve-in)] motion-reduce:[animation:none]",
              )}
            >
              <ArtifactVolumeControl
                layout="horizontal"
                trackLengthPx={200}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <ControlStrip
        onOpenFile={onOpenFile}
        isMobile={isMobile}
        onOpenLibrary={onOpenLibrary}
        onOpenQueue={onOpenQueue}
      />
    </>
  );
}
