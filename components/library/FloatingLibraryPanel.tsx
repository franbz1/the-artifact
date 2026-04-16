"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useCallback, useRef, useState, type RefObject } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { DND_TYPE_LIBRARY_TRACK } from "@/components/player/playback-dnd.constants";
import { SECONDARY_PANEL_REGION_ID } from "@/components/player/secondary-panel.constants";
import { trackLabel, type TrackEntry } from "@/lib/playback-queue";
import { cn } from "@/lib/utils";
import {
  LIBRARY_FLOATING_PANEL_MAX_HEIGHT_REM,
  LIBRARY_FLOATING_PANEL_WIDTH_CLASS,
  LIBRARY_FLOATING_PANEL_Z,
  LIBRARY_PANEL_MOTION_OFFSET_PX,
  LIBRARY_PANEL_RIGHT_OFFSET_REM,
} from "./library-floating-panel.constants";

const EASE_DISSOLVE = [0.4, 0, 0.1, 1] as const;
const EASE_GEOLOGICAL = [0.22, 0.68, 0.35, 1] as const;

export interface FloatingLibraryPanelProps {
  panelRef?: RefObject<HTMLElement | null>;
  /** When stacked: ref to the whole library column for DnD hit-testing (queue drag → remove). */
  libraryBoundsRef?: RefObject<HTMLElement | null>;
  /** When true, panel is a block inside the stacked sidebar (no fixed positioning). */
  stacked?: boolean;
  /** Taller, scrollable block in mobile bottom sheet (vs compact strip in desktop sidebar). */
  sheetMode?: boolean;
  reduceMotion: boolean | null;
  className?: string;
}

function LibraryTrackRow({
  entry,
  reduceMotion,
  onPlay,
  showAddShortcut,
  onAddToQueue,
}: {
  entry: TrackEntry;
  reduceMotion: boolean | null;
  onPlay: (id: string) => void;
  showAddShortcut?: boolean;
  onAddToQueue?: (id: string) => void;
}) {
  const clipRef = useRef<HTMLSpanElement>(null);
  const [surfaceActive, setSurfaceActive] = useState(false);
  const [revealShift, setRevealShift] = useState(0);
  const label = trackLabel(entry);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({
      id: `lib-${entry.id}`,
      data: {
        type: DND_TYPE_LIBRARY_TRACK,
        libraryEntryId: entry.id,
        label,
      },
    });

  const measureRevealShift = useCallback(() => {
    if (reduceMotion) return;
    const clip = clipRef.current;
    if (!clip) return;
    const inner = clip.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const extra = inner.scrollWidth - clip.clientWidth;
    setRevealShift(extra > 0 ? extra : 0);
  }, [reduceMotion]);

  const scheduleMeasureRevealShift = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureRevealShift();
      });
    });
  }, [measureRevealShift]);

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 items-stretch border-b border-border-faint/60 last:border-b-0",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => {
          void onPlay(entry.id);
        }}
        onPointerEnter={() => {
          setSurfaceActive(true);
          scheduleMeasureRevealShift();
        }}
        onPointerLeave={() => {
          setSurfaceActive(false);
          setRevealShift(0);
        }}
        onFocus={() => {
          setSurfaceActive(true);
          scheduleMeasureRevealShift();
        }}
        onBlur={() => {
          setSurfaceActive(false);
          setRevealShift(0);
        }}
        className={cn(
          "touch-none flex min-w-0 flex-1 cursor-grab items-center px-grain py-1.5 text-left outline-none active:cursor-grabbing",
          "transition-[background-color] duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
          "hover:bg-surface-overlay/40 focus-visible:bg-surface-overlay/40",
          "focus-visible:ring-1 focus-visible:ring-lunar/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
        )}
      >
        <span
          ref={clipRef}
          className="block min-w-0 flex-1 overflow-hidden text-left"
        >
          <span
            className={cn(
              "block font-sans text-sm text-membrane transition-transform duration-500 ease-[var(--ease-awareness)] motion-reduce:transition-none",
              surfaceActive && revealShift > 0
                ? "max-w-none whitespace-nowrap"
                : "truncate",
            )}
            style={{
              transform:
                surfaceActive && revealShift > 0 && !reduceMotion
                  ? `translateX(-${revealShift}px)`
                  : undefined,
            }}
          >
            {label}
          </span>
        </span>
      </button>
      {showAddShortcut && onAddToQueue ? (
        <button
          type="button"
          aria-label="Add to playback queue"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(entry.id);
          }}
          className={cn(
            "shrink-0 border-l border-border-faint/60 px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-inscription outline-none",
            "transition-colors duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
            "hover:bg-surface-overlay/35 hover:text-membrane-dim focus-visible:bg-surface-overlay/40",
            "focus-visible:ring-1 focus-visible:ring-lunar/50",
          )}
        >
          Add
        </button>
      ) : null}
    </li>
  );
}

export function FloatingLibraryPanel({
  panelRef,
  libraryBoundsRef,
  stacked,
  sheetMode = false,
  reduceMotion,
  className,
}: FloatingLibraryPanelProps) {
  const { library, playLibraryEntry, addLibraryEntryToQueueAt } = useAudio();
  const rm = reduceMotion === true;

  const onPlay = (id: string) => {
    void playLibraryEntry(id);
  };

  const onAddToQueue = (id: string) => {
    void addLibraryEntryToQueueAt(id);
  };

  const layoutStyle = stacked
    ? undefined
    : {
        right: `calc(${LIBRARY_PANEL_RIGHT_OFFSET_REM}rem + env(safe-area-inset-right, 0px))`,
        zIndex: LIBRARY_FLOATING_PANEL_Z,
        maxHeight: `${LIBRARY_FLOATING_PANEL_MAX_HEIGHT_REM}rem`,
      };

  const body = (
    <>
      <p className="shrink-0 border-b border-border-faint/80 px-breath pb-2 pt-3 font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-text-inscription">
        Library
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-grain py-1">
        {library.length === 0 ? (
          <p className="px-grain py-3 font-sans text-sm text-membrane-dim">
            No tracks
          </p>
        ) : (
          <ul className="min-w-0">
            {library.map((entry) => (
              <LibraryTrackRow
                key={entry.id}
                entry={entry}
                reduceMotion={reduceMotion}
                onPlay={onPlay}
                showAddShortcut={sheetMode}
                onAddToQueue={sheetMode ? onAddToQueue : undefined}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (stacked) {
    return (
      <aside
        ref={libraryBoundsRef}
        role="region"
        aria-label="Library"
        className={cn(
          "relative flex w-full min-h-0 shrink-0 flex-col overflow-hidden border-b border-border-faint/80",
          sheetMode
            ? "max-h-none min-h-0 flex-1 border-b-0"
            : "max-h-[6rem]",
          className,
        )}
      >
        {body}
      </aside>
    );
  }

  return (
    <motion.aside
      ref={panelRef}
      id={SECONDARY_PANEL_REGION_ID}
      role="region"
      aria-label="Library"
      initial={
        rm
          ? { opacity: 0, filter: "blur(0px)", x: 0 }
          : {
              opacity: 0,
              filter: "blur(8px)",
              x: LIBRARY_PANEL_MOTION_OFFSET_PX,
            }
      }
      animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
      exit={
        rm
          ? {
              opacity: 0,
              filter: "blur(0px)",
              x: 0,
              transition: { duration: 0.1, ease: EASE_DISSOLVE },
            }
          : {
              opacity: 0,
              filter: "blur(8px)",
              x: LIBRARY_PANEL_MOTION_OFFSET_PX,
              transition: { duration: 0.45, ease: EASE_DISSOLVE },
            }
      }
      transition={
        rm
          ? { duration: 0.12, ease: EASE_DISSOLVE }
          : {
              duration: 0.5,
              ease: EASE_GEOLOGICAL,
            }
      }
      style={layoutStyle}
      className={cn(
        "flex flex-col overflow-hidden shadow-depth",
        "pointer-events-auto fixed top-1/2 -translate-y-1/2",
        LIBRARY_FLOATING_PANEL_WIDTH_CLASS,
        "glass-obsidian border border-border-faint/80",
        className,
      )}
    >
      {body}
    </motion.aside>
  );
}
