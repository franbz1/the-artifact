"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const EASE_DISSOLVE = [0.4, 0, 0.1, 1] as const;

export interface LibraryRemoveConfirmDialogProps {
  trackLabel: string;
  reduceMotion: boolean | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LibraryRemoveConfirmDialog({
  trackLabel,
  reduceMotion,
  onConfirm,
  onCancel,
}: LibraryRemoveConfirmDialogProps) {
  const rm = reduceMotion === true;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <motion.div
      role="presentation"
      initial={rm ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={rm ? { opacity: 0 } : { opacity: 0, filter: "blur(8px)" }}
      transition={
        rm
          ? { duration: 0.12, ease: EASE_DISSOLVE }
          : { duration: 0.35, ease: EASE_DISSOLVE }
      }
      className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-void/75 px-breath py-breath backdrop-blur-[2px]"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="library-remove-title"
        aria-describedby="library-remove-desc"
        initial={rm ? undefined : { opacity: 0, y: 6, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={rm ? undefined : { opacity: 0, filter: "blur(6px)" }}
        transition={{ duration: 0.4, ease: [0.22, 0.68, 0.35, 1] }}
        className={cn(
          "pointer-events-auto w-full max-w-sm border border-border-faint/80 shadow-depth",
          "glass-obsidian px-breath pb-breath pt-5",
        )}
      >
        <h2
          id="library-remove-title"
          className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-text-inscription"
        >
          Remove from library
        </h2>
        <p
          id="library-remove-desc"
          className="mt-3 font-sans text-sm leading-relaxed text-membrane"
        >
          This will remove{" "}
          <span className="text-membrane/95">{trackLabel}</span> from the
          library and from the queue, including if it is playing now.
        </p>
        <div className="mt-6 flex justify-end gap-grain">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "cursor-pointer rounded-sm px-3 py-1.5 font-sans text-sm text-membrane-dim outline-none",
              "transition-[color,background-color] duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
              "hover:bg-surface-overlay/30 hover:text-membrane",
              "focus-visible:ring-1 focus-visible:ring-lunar/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "cursor-pointer rounded-sm border border-lunar/35 bg-surface-overlay/20 px-3 py-1.5 font-sans text-sm text-membrane outline-none",
              "transition-[border-color,background-color] duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
              "hover:border-lunar/50 hover:bg-lunar/10",
              "focus-visible:ring-1 focus-visible:ring-lunar/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
            )}
          >
            Remove
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
