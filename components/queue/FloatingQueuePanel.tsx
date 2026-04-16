"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  DND_TYPE_LIBRARY_TRACK,
  DND_TYPE_QUEUE_TRACK,
  QUEUE_APPEND_TAIL_ID,
  QUEUE_DROP_ZONE_ID,
} from "@/components/player/playback-dnd.constants";
import { trackLabel, type TrackEntry } from "@/lib/playback-queue";
import { cn } from "@/lib/utils";
import {
  QUEUE_FLOATING_PANEL_MAX_HEIGHT_REM,
  QUEUE_FLOATING_PANEL_MIN_BODY_REM,
  QUEUE_FLOATING_PANEL_WIDTH_CLASS,
  QUEUE_FLOATING_PANEL_Z,
  QUEUE_PANEL_MOTION_OFFSET_PX,
  QUEUE_PANEL_RIGHT_OFFSET_REM,
} from "./queue-floating-panel.constants";

const EASE_DISSOLVE = [0.4, 0, 0.1, 1] as const;
const EASE_GEOLOGICAL = [0.22, 0.68, 0.35, 1] as const;

/**
 * Registers `QUEUE_DROP_ZONE_ID` only when the queue is empty so library drops
 * still work, and dragging a queue row out is not captured by a full-height droppable
 * (which would block `over === null` / removal in SecondaryPanel).
 */
function QueueEmptyDropZone({
  libraryDragActive,
  children,
}: {
  libraryDragActive?: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: QUEUE_DROP_ZONE_ID,
    data: { type: "queue-drop-zone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-grain py-1",
        libraryDragActive && isOver && "bg-lunar/5 ring-1 ring-inset ring-lunar/25",
      )}
      style={{ minHeight: `${QUEUE_FLOATING_PANEL_MIN_BODY_REM}rem` }}
    >
      {children}
    </div>
  );
}

/** Hit target below the last row: append library clone at tail or move queue item to end. */
function QueueAppendTailDropZone({
  libraryDragActive,
}: {
  libraryDragActive?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: QUEUE_APPEND_TAIL_ID,
    data: { type: "queue-append-tail" },
  });

  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "min-h-4 w-full shrink-0 border-t border-border-faint/50",
        libraryDragActive && isOver && "border-lunar/40 bg-lunar/5",
      )}
    />
  );
}

export interface FloatingQueuePanelProps {
  /** When true, panel is a block inside the stacked sidebar (no fixed positioning). */
  stacked?: boolean;
  reduceMotion: boolean | null;
  /** Highlights empty drop zone while dragging from library. */
  libraryDragActive?: boolean;
  className?: string;
}

function QueueTrackRow({
  entry,
  reduceMotion,
  isCurrent,
}: {
  entry: TrackEntry;
  reduceMotion: boolean | null;
  /** Now playing — subtle emphasis vs upcoming tracks. */
  isCurrent: boolean;
}) {
  const { playQueueEntry } = useAudio();
  const clipRef = useRef<HTMLSpanElement>(null);
  const [surfaceActive, setSurfaceActive] = useState(false);
  const [revealShift, setRevealShift] = useState(0);
  const label = trackLabel(entry);

  const { active, over } = useDndContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { type: DND_TYPE_QUEUE_TRACK, entry },
  });

  const insertionTarget =
    active &&
    over?.id === entry.id &&
    active.id !== entry.id &&
    (active.data.current?.type === DND_TYPE_QUEUE_TRACK ||
      active.data.current?.type === DND_TYPE_LIBRARY_TRACK);

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-0 border-b border-border-faint/60 last:border-b-0",
        isDragging && "opacity-40",
        insertionTarget && "border-t border-t-lunar/55",
        isCurrent &&
          "bg-surface-overlay/35 ring-1 ring-inset ring-lunar/25 pl-0.5",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={() => {
          void playQueueEntry(entry.id);
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
          "touch-none flex w-full min-w-0 cursor-grab items-center px-grain py-1.5 text-left outline-none active:cursor-grabbing",
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
              "block font-sans text-sm transition-transform duration-500 ease-[var(--ease-awareness)] motion-reduce:transition-none",
              isCurrent ? "text-membrane" : "text-membrane-dim",
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
    </li>
  );
}

export function FloatingQueuePanel({
  stacked,
  reduceMotion,
  libraryDragActive,
  className,
}: FloatingQueuePanelProps) {
  const { queueSnapshot, currentTrackId } = useAudio();
  const rm = reduceMotion === true;

  const queueIds = queueSnapshot.map((e) => e.id);
  const showEmptyHint = queueSnapshot.length === 0;

  const queueBody = (
    <>
      {showEmptyHint ? (
        <p
          className={cn(
            "flex flex-1 items-center justify-center px-grain py-6 text-center font-sans text-sm text-text-inscription",
            libraryDragActive && "text-membrane-dim",
          )}
        >
          Drop tracks here
        </p>
      ) : null}

      <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
        <ul className="min-w-0">
          {queueSnapshot.map((entry) => (
            <QueueTrackRow
              key={entry.id}
              entry={entry}
              reduceMotion={reduceMotion}
              isCurrent={entry.id === currentTrackId}
            />
          ))}
        </ul>
      </SortableContext>
      {!showEmptyHint && queueSnapshot.length > 0 ? (
        <QueueAppendTailDropZone libraryDragActive={libraryDragActive} />
      ) : null}
    </>
  );

  const motionStyle = stacked
    ? {
        maxHeight: `${QUEUE_FLOATING_PANEL_MAX_HEIGHT_REM}rem`,
      }
    : {
        right: `calc(${QUEUE_PANEL_RIGHT_OFFSET_REM}rem + env(safe-area-inset-right, 0px))`,
        zIndex: QUEUE_FLOATING_PANEL_Z,
        maxHeight: `${QUEUE_FLOATING_PANEL_MAX_HEIGHT_REM}rem`,
      };

  const headerAndBody = (
    <>
      <p className="shrink-0 border-b border-border-faint/80 px-breath pb-2 pt-3 font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-text-inscription">
        Queue
      </p>
      {showEmptyHint ? (
        <QueueEmptyDropZone libraryDragActive={libraryDragActive}>
          {queueBody}
        </QueueEmptyDropZone>
      ) : (
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-grain py-1"
          style={{ minHeight: `${QUEUE_FLOATING_PANEL_MIN_BODY_REM}rem` }}
        >
          {queueBody}
        </div>
      )}
    </>
  );

  if (stacked) {
    return (
      <aside
        role="region"
        aria-label="Playback queue"
        style={motionStyle}
        className={cn(
          "relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden",
          className,
        )}
      >
        {headerAndBody}
      </aside>
    );
  }

  return (
    <motion.aside
      role="region"
      aria-label="Playback queue"
      initial={
        rm
          ? { opacity: 0, filter: "blur(0px)", x: 0 }
          : {
              opacity: 0,
              filter: "blur(8px)",
              x: QUEUE_PANEL_MOTION_OFFSET_PX,
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
              x: QUEUE_PANEL_MOTION_OFFSET_PX,
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
      style={motionStyle}
      className={cn(
        "flex flex-col overflow-hidden shadow-depth",
        "glass-obsidian border border-border-faint/80",
        "pointer-events-auto fixed top-1/2 -translate-y-1/2",
        QUEUE_FLOATING_PANEL_WIDTH_CLASS,
        className,
      )}
    >
      {headerAndBody}
    </motion.aside>
  );
}
