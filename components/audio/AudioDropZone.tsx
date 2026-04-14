"use client";

import { useCallback, useRef, useState, useEffect, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { useAudio } from "./AudioProvider";

const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;
const ACCEPTED_INPUT = ".mp3,.wav,.ogg,.flac,.m4a,.aac,.webm";

const ACCEPTED_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
]);

function isAudioFile(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name);
}

export function AudioDropZone() {
  const { loadFile, play, toggle, isPlaying, isLoaded, fileName } = useAudio();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const loadAndPlay = useCallback(
    async (file: File) => {
      await loadFile(file);
      await play();
    },
    [loadFile, play],
  );

  useEffect(() => {
    const onDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current++;
      if (dragCountRef.current === 1) {
        setIsDragOver(true);
      }
    };

    const onDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const onDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current--;
      if (dragCountRef.current <= 0) {
        dragCountRef.current = 0;
        setIsDragOver(false);
      }
    };

    const onDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setIsDragOver(false);

      const file = e.dataTransfer?.files[0];
      if (file && isAudioFile(file)) {
        loadAndPlay(file);
      }
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [loadAndPlay]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isAudioFile(file)) {
        await loadAndPlay(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [loadAndPlay],
  );

  const handleClick = useCallback(async () => {
    if (isLoaded) {
      await toggle();
    } else {
      fileInputRef.current?.click();
    }
  }, [isLoaded, toggle]);

  return (
    <>
      {/* Full-page visual overlay — only visible during drag */}
      {isDragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-lunar/[0.03] border border-lunar/20 pointer-events-none">
          <span className="text-inscription text-membrane-dim">
            Release to awaken
          </span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_INPUT}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Visible control bar */}
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          "interact-aware cursor-pointer select-none",
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
          "px-6 py-3 rounded-sm",
          "border border-border-faint",
          "transition-all duration-300",
        )}
      >
        {isLoaded ? (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "block w-1.5 h-1.5 rounded-full transition-colors duration-500",
                isPlaying ? "bg-lunar-bright" : "bg-slate",
              )}
            />
            <span className="text-rune">{fileName}</span>
          </div>
        ) : (
          <span className="text-rune">Click or drop audio file to begin</span>
        )}
      </div>
    </>
  );
}
