"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseDocumentAudioDropOptions {
  onDropFiles: (files: File[]) => void | Promise<void>;
}

/**
 * Full-viewport drag-and-drop (listeners on `document`).
 */
export function useDocumentAudioDrop({ onDropFiles }: UseDocumentAudioDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCountRef = useRef(0);

  const onDropFilesStable = useCallback(
    async (files: File[]) => {
      await onDropFiles(files);
    },
    [onDropFiles],
  );

  useEffect(() => {
    const onDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current += 1;
      if (dragCountRef.current === 1) {
        setIsDragOver(true);
      }
    };

    const onDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const onDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current -= 1;
      if (dragCountRef.current <= 0) {
        dragCountRef.current = 0;
        setIsDragOver(false);
      }
    };

    const onDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setIsDragOver(false);

      const dt = e.dataTransfer?.files;
      if (dt?.length) {
        void onDropFilesStable(Array.from(dt));
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
  }, [onDropFilesStable]);

  return { isDragOver };
}
