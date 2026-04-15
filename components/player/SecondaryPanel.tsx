"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  LIBRARY_FLOATING_PANEL_WIDTH_CLASS,
  LIBRARY_FLOATING_PANEL_Z,
  LIBRARY_PANEL_RIGHT_OFFSET_REM,
} from "@/components/library/library-floating-panel.constants";
import { LibraryRemoveConfirmDialog } from "@/components/library/LibraryRemoveConfirmDialog";
import { FloatingLibraryPanel } from "@/components/library/FloatingLibraryPanel";
import { FloatingQueuePanel } from "@/components/queue/FloatingQueuePanel";
import {
  DND_TYPE_LIBRARY_TRACK,
  DND_TYPE_QUEUE_TRACK,
  LIBRARY_DRAG_ID_PREFIX,
  QUEUE_APPEND_TAIL_ID,
  QUEUE_DROP_ZONE_ID,
} from "@/components/player/playback-dnd.constants";
import { trackLabel, type TrackEntry } from "@/lib/playback-queue";
import { cn } from "@/lib/utils";
import {
  SECONDARY_PANEL_REGION_ID,
  SECONDARY_PANEL_TRIGGER_GUTTER_REM,
  SECONDARY_PANEL_TRIGGER_ZONE_VH,
} from "./secondary-panel.constants";
import { createSidebarCollisionDetection } from "./sidebar-dnd-collision";

function isCenterOutsideRect(
  x: number,
  y: number,
  rect: DOMRectReadOnly,
): boolean {
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}

/** Resolves library entry id when `data.libraryEntryId` is missing (dnd-kit edge cases). */
function libraryEntryIdFromActiveDrag(
  data: Record<string, unknown> | undefined,
  activeId: string | number,
): string | undefined {
  const fromData = data?.libraryEntryId;
  if (typeof fromData === "string" && fromData.length > 0) return fromData;
  const s = String(activeId);
  if (s.startsWith(LIBRARY_DRAG_ID_PREFIX)) {
    return s.slice(LIBRARY_DRAG_ID_PREFIX.length);
  }
  return undefined;
}

interface SecondaryPanelProps {
  className?: string;
}

type ActiveDragInfo = {
  id: string;
  label: string;
  kind: "library" | "queue";
};

/** Stroke glyph aligned with ControlStrip transport icons (chevrons, line caps). */
function GlyphRevealPanel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-8 w-8 text-membrane-dim", className)}
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 7.5 L9 12 L15 16.5" opacity="0.72" />
        <path d="M19 7.5 L13 12 L19 16.5" />
      </g>
    </svg>
  );
}

function DragGhostRow({
  label,
  dismiss,
}: {
  label: string;
  dismiss?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-[min(18rem,40vw)] max-w-[min(18rem,40vw)] min-w-0 cursor-grabbing items-center px-grain py-1.5",
        "glass-obsidian border border-border-faint/80 shadow-depth",
        "font-sans text-sm text-membrane",
        dismiss && "border-border-faint/40 opacity-45 blur-[1px]",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </div>
  );
}

export function SecondaryPanel({ className }: SecondaryPanelProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const libraryPanelBoundsRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const collisionDetection = useMemo(
    () =>
      createSidebarCollisionDetection({
        sidebarStackRef: panelRef,
        libraryPanelRef: libraryPanelBoundsRef,
      }),
    [],
  );

  const {
    queueSnapshot,
    addLibraryEntryToQueueAt,
    removeTrack,
    moveBefore,
    moveAfter,
    removeLibraryEntry,
  } = useAudio();

  const [activeInfo, setActiveInfo] = useState<ActiveDragInfo | null>(null);
  const [libraryRemovePrompt, setLibraryRemovePrompt] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [queueDragOutside, setQueueDragOutside] = useState(false);
  /** Last pointer collision: no droppable (used so drag-end still removes when dnd-kit reports `over` as self). */
  const queuePointerWasOutsideRef = useRef(false);
  /** Library drag: pointer left the sidebar stack (collision []); used so drop outside opens remove confirm. */
  const libraryPointerWasOutsideRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleFromButton = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (libraryRemovePrompt) return;
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closePanel, libraryRemovePrompt]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (libraryRemovePrompt) return;
      const node = e.target as Node;
      if (panelRef.current?.contains(node)) return;
      if (triggerRef.current?.contains(node)) return;
      closePanel();
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open, closePanel, libraryRemovePrompt]);

  const cancelLibraryRemove = useCallback(() => {
    setLibraryRemovePrompt(null);
  }, []);

  const confirmLibraryRemove = useCallback(() => {
    if (!libraryRemovePrompt) return;
    removeLibraryEntry(libraryRemovePrompt.id);
    setLibraryRemovePrompt(null);
  }, [libraryRemovePrompt, removeLibraryEntry]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (!data?.type) return;
    if (data.type === DND_TYPE_LIBRARY_TRACK) {
      setActiveInfo({
        id: String(active.id),
        label: String(data.label ?? ""),
        kind: "library",
      });
      setQueueDragOutside(false);
      libraryPointerWasOutsideRef.current = false;
      return;
    }
    if (data.type === DND_TYPE_QUEUE_TRACK) {
      const entry = data.entry as TrackEntry;
      setActiveInfo({
        id: String(active.id),
        label: trackLabel(entry),
        kind: "queue",
      });
      setQueueDragOutside(false);
      queuePointerWasOutsideRef.current = false;
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const t = event.active.data.current?.type;
    if (t === DND_TYPE_QUEUE_TRACK) {
      const outside = event.over == null;
      queuePointerWasOutsideRef.current = outside;
      setQueueDragOutside(outside);
    }
    if (t === DND_TYPE_LIBRARY_TRACK) {
      libraryPointerWasOutsideRef.current = event.over == null;
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const data = active.data.current;
      const pointerLeftQueue = queuePointerWasOutsideRef.current;
      queuePointerWasOutsideRef.current = false;
      const pointerLeftLibraryStack = libraryPointerWasOutsideRef.current;
      libraryPointerWasOutsideRef.current = false;
      setActiveInfo(null);
      setQueueDragOutside(false);

      if (!data?.type) return;

      if (data.type === DND_TYPE_LIBRARY_TRACK) {
        const libraryEntryId = libraryEntryIdFromActiveDrag(
          data as Record<string, unknown>,
          active.id,
        );
        if (!libraryEntryId) return;
        const label = String(data.label ?? "");

        const translated =
          active.rect.current.translated ?? active.rect.current.initial;
        const stack = panelRef.current;
        const centerOutsideStack =
          translated && stack
            ? isCenterOutsideRect(
                translated.left + translated.width / 2,
                translated.top + translated.height / 2,
                stack.getBoundingClientRect(),
              )
            : false;

        const shouldPromptLibraryRemove =
          pointerLeftLibraryStack || (!over && centerOutsideStack);

        if (shouldPromptLibraryRemove) {
          setLibraryRemovePrompt({ id: libraryEntryId, label });
          return;
        }

        if (!over) return;

        const overId = String(over.id);
        if (overId.startsWith("lib-")) return;
        if (overId === QUEUE_DROP_ZONE_ID) {
          void addLibraryEntryToQueueAt(libraryEntryId);
          return;
        }
        if (overId === QUEUE_APPEND_TAIL_ID) {
          void addLibraryEntryToQueueAt(libraryEntryId);
          return;
        }
        void addLibraryEntryToQueueAt(libraryEntryId, overId);
        return;
      }

      if (data.type === DND_TYPE_QUEUE_TRACK) {
        const activeId = String(active.id);

        if (over && String(over.id).startsWith("lib-")) {
          void removeTrack(activeId);
          return;
        }

        if (!over) {
          void removeTrack(activeId);
          return;
        }

        const overId = String(over.id);
        if (overId === activeId) {
          if (pointerLeftQueue) {
            void removeTrack(activeId);
          }
          return;
        }

        if (overId === QUEUE_DROP_ZONE_ID || overId === QUEUE_APPEND_TAIL_ID) {
          const ids = queueSnapshot.map((e) => e.id);
          const lastId = ids[ids.length - 1];
          if (lastId && activeId !== lastId) {
            moveAfter(activeId, lastId);
          }
          return;
        }

        const ids = queueSnapshot.map((e) => e.id);
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const newIds = arrayMove(ids, oldIndex, newIndex);
        const newPos = newIds.indexOf(activeId);
        const prevId = newPos > 0 ? newIds[newPos - 1] : null;
        const nextId = newPos < newIds.length - 1 ? newIds[newPos + 1] : null;

        if (prevId) {
          moveAfter(activeId, prevId);
        } else if (nextId) {
          moveBefore(activeId, nextId);
        }
      }
    },
    [
      addLibraryEntryToQueueAt,
      moveAfter,
      moveBefore,
      queueSnapshot,
      removeTrack,
    ],
  );

  const handleDragCancel = useCallback(() => {
    queuePointerWasOutsideRef.current = false;
    libraryPointerWasOutsideRef.current = false;
    setActiveInfo(null);
    setQueueDragOutside(false);
  }, []);

  return (
    <>
    <div
      className={cn(
        "pointer-events-none fixed inset-y-0 right-0 z-40",
        "pr-[env(safe-area-inset-right,0px)]",
        className,
      )}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <AnimatePresence>
          {open ? (
            <motion.div
              key="sidebar-stack"
              ref={panelRef}
              id={SECONDARY_PANEL_REGION_ID}
              role="region"
              aria-label="Library and playback queue"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0.1 } }
                  : { opacity: 0, filter: "blur(6px)", transition: { duration: 0.35 } }
              }
              transition={{ duration: 0.4, ease: [0.22, 0.68, 0.35, 1] }}
              style={{
                right: `calc(${LIBRARY_PANEL_RIGHT_OFFSET_REM}rem + env(safe-area-inset-right, 0px))`,
                zIndex: LIBRARY_FLOATING_PANEL_Z,
              }}
              className={cn(
                "pointer-events-auto fixed top-1/2 flex max-h-[min(90vh,36rem)] -translate-y-1/2 flex-col gap-grain overflow-visible",
                LIBRARY_FLOATING_PANEL_WIDTH_CLASS,
              )}
            >
              <FloatingLibraryPanel
                stacked
                libraryBoundsRef={libraryPanelBoundsRef}
                reduceMotion={reduceMotion}
              />
              <FloatingQueuePanel
                stacked
                reduceMotion={reduceMotion}
                libraryDragActive={activeInfo?.kind === "library"}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <DragOverlay dropAnimation={{ duration: 220, easing: "ease-out" }}>
          {activeInfo ? (
            <DragGhostRow
              label={activeInfo.label}
              dismiss={activeInfo.kind === "queue" && queueDragOutside}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div
        ref={triggerRef}
        className={cn(
          "group/trigger pointer-events-auto absolute top-1/2 right-0 flex -translate-y-1/2 items-center justify-end",
          "motion-reduce:transition-none",
        )}
        style={{
          width: `${SECONDARY_PANEL_TRIGGER_GUTTER_REM}rem`,
          height: `min(${SECONDARY_PANEL_TRIGGER_ZONE_VH}vh, 14rem)`,
        }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={SECONDARY_PANEL_REGION_ID}
          aria-label={open ? "Close library and queue" : "Open library and queue"}
          onClick={toggleFromButton}
          className={cn(
            "pointer-events-none flex h-12 w-12 shrink-0 items-center justify-center bg-transparent outline-none",
            "group-hover/trigger:pointer-events-auto",
            "focus-visible:pointer-events-auto",
            "focus-visible:ring-1 focus-visible:ring-lunar/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
            "cursor-pointer",
            "transition-[opacity,filter] duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
            "motion-reduce:duration-150",
            "opacity-0 blur-[6px] motion-reduce:blur-none",
            "group-hover/trigger:opacity-100 group-hover/trigger:blur-none",
            "focus-visible:opacity-100 focus-visible:blur-none",
          )}
        >
          <GlyphRevealPanel
            className={cn(
              "animate-pulse-faint motion-reduce:animate-none",
              open && "pointer-events-none opacity-0 animate-none",
            )}
          />
        </button>
      </div>
    </div>

    <AnimatePresence>
      {libraryRemovePrompt ? (
        <LibraryRemoveConfirmDialog
          key={libraryRemovePrompt.id}
          trackLabel={libraryRemovePrompt.label}
          reduceMotion={reduceMotion}
          onConfirm={confirmLibraryRemove}
          onCancel={cancelLibraryRemove}
        />
      ) : null}
    </AnimatePresence>
    </>
  );
}
