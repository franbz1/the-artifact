"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseDocumentAudioDropOptions {
  onDropFile: (file: File) => void | Promise<void>;
}

/**
 * Full-viewport drag-and-drop (listeners on `document`).
 */
export function useDocumentAudioDrop({ onDropFile }: UseDocumentAudioDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCountRef = useRef(0);

  const onDropFileStable = useCallback(
    async (file: File) => {
      await onDropFile(file);
    },
    [onDropFile],
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

      const file = e.dataTransfer?.files[0];
      if (file) {
        void onDropFileStable(file);
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
  }, [onDropFileStable]);

  return { isDragOver };
}
