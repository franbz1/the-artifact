"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/components/audio/AudioProvider";
import { CONTROL_STRIP_DOCK_CLASS } from "@/components/visualizer/visualizer.constants";
import {
  CONTROL_STRIP_LONG_PRESS_MS,
  CONTROL_STRIP_LONG_PRESS_MOVE_PX,
  CONTROL_STRIP_SHELL_WIDTH_REM,
  CONTROL_STRIP_SKIP_CLICK_MAX_MS,
  CONTROL_STRIP_SKIP_CLICK_MOVE_TOLERANCE_PX,
  CONTROL_STRIP_SKIP_HOLD_BEFORE_SEEK_MS,
  CONTROL_STRIP_SKIP_HOLD_SEEK_INTERVAL_MS,
  CONTROL_STRIP_SKIP_SECONDS,
} from "./control-strip.constants";
interface ControlStripProps {
  className?: string;
  onOpenFile: () => void;
}

function GlyphSkip({ direction }: { direction: "back" | "forward" }) {
  // Local paths point right (>>); mirror only for skip back so it reads «.
  const flip = direction === "back";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 text-membrane-dim"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={flip ? "scale(-1,1) translate(-24,0)" : undefined}
      >
        {/* Leading chevron — two strokes meeting at the tip */}
        <path d="M5.5 7.5 L11 12" />
        <path d="M5.5 16.5 L11 12" />
        {/* Trailing chevron */}
        <path d="M10.5 7.5 L16 12" opacity="0.72" />
        <path d="M10.5 16.5 L16 12" opacity="0.72" />
      </g>
    </svg>
  );
}

function GlyphPlayPause({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-membrane">
      {playing ? (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M8 6v12" />
          <path d="M16 6v12" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M9 6v12M13 8.5v7M17 11v2" opacity="0.9" />
        </g>
      )}
    </svg>
  );
}

interface QueueSkipButtonProps {
  direction: "back" | "forward";
  isLoaded: boolean;
  duration: number;
  currentTime: number;
  seek: (time: number) => void;
  skipToPrevious: () => Promise<void>;
  skipToNext: () => Promise<void>;
}

function QueueSkipButton({
  direction,
  isLoaded,
  duration,
  currentTime,
  seek,
  skipToPrevious,
  skipToNext,
}: QueueSkipButtonProps) {
  const durationRef = useRef(duration);
  const currentTimeRef = useRef(currentTime);
  durationRef.current = duration;
  currentTimeRef.current = currentTime;

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downMetaRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const holdSeekActiveRef = useRef(false);

  const clearSeekHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current);
      seekIntervalRef.current = null;
    }
  }, []);

  const applyTimeSeek = useCallback(() => {
    const d = durationRef.current;
    const t = currentTimeRef.current;
    if (direction === "back") {
      seek(Math.max(0, t - CONTROL_STRIP_SKIP_SECONDS));
    } else {
      if (!d) return;
      seek(Math.min(d, t + CONTROL_STRIP_SKIP_SECONDS));
    }
  }, [direction, seek]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isLoaded) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      downMetaRef.current = { t: Date.now(), x: e.clientX, y: e.clientY };
      holdSeekActiveRef.current = false;
      holdTimerRef.current = setTimeout(() => {
        holdSeekActiveRef.current = true;
        applyTimeSeek();
        seekIntervalRef.current = setInterval(
          applyTimeSeek,
          CONTROL_STRIP_SKIP_HOLD_SEEK_INTERVAL_MS,
        );
      }, CONTROL_STRIP_SKIP_HOLD_BEFORE_SEEK_MS);
    },
    [applyTimeSeek, isLoaded],
  );

  const endGesture = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      clearSeekHold();
      const meta = downMetaRef.current;
      downMetaRef.current = null;
      if (holdSeekActiveRef.current) {
        holdSeekActiveRef.current = false;
        return;
      }
      if (!meta) return;
      const dt = Date.now() - meta.t;
      const moved = Math.hypot(e.clientX - meta.x, e.clientY - meta.y);
      if (
        dt < CONTROL_STRIP_SKIP_CLICK_MAX_MS &&
        moved < CONTROL_STRIP_SKIP_CLICK_MOVE_TOLERANCE_PX
      ) {
        if (direction === "back") void skipToPrevious();
        else void skipToNext();
      }
    },
    [clearSeekHold, direction, skipToNext, skipToPrevious],
  );

  const isBack = direction === "back";

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onPointerLeave={(e) => {
        if (e.buttons === 0) endGesture(e);
      }}
      aria-label={
        isBack
          ? "Previous track in queue. Hold to seek backward in the track."
          : "Next track in queue. Hold to seek forward in the track."
      }
      title={
        isBack
          ? "Previous track (hold: seek back)"
          : "Next track (hold: seek forward)"
      }
      className={cn(
        "interact-aware cursor-pointer rounded-sm p-1.5 outline-none",
        "focus-visible:ring-1 focus-visible:ring-lunar/50",
      )}
    >
      <GlyphSkip direction={direction} />
    </button>
  );
}

function GlyphOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-membrane-dim">
      <path
        d="M6 10h6a4 4 0 0 1 0 8H8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M10 6h6a4 4 0 0 1 0 8h-2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function ControlStrip({ className, onOpenFile }: ControlStripProps) {
  const {
    toggle,
    seek,
    isPlaying,
    isLoaded,
    currentTime,
    duration,
    skipToNext,
    skipToPrevious,
  } = useAudio();

  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [mockShuffle, setMockShuffle] = useState(false);
  const [mockRepeat, setMockRepeat] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  }, []);

  const onDockPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest('[role="slider"]')
      ) {
        return;
      }
      longPressStartRef.current = { x: e.clientX, y: e.clientY };
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        setSecondaryOpen(true);
      }, CONTROL_STRIP_LONG_PRESS_MS);
    },
    [],
  );

  const onDockPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = longPressStartRef.current;
      if (!start || !longPressTimerRef.current) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > CONTROL_STRIP_LONG_PRESS_MOVE_PX) {
        clearLongPress();
      }
    },
    [clearLongPress],
  );

  const onDockPointerEnd = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  useEffect(() => {
    if (!secondaryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSecondaryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [secondaryOpen]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50",
        CONTROL_STRIP_DOCK_CLASS,
        className,
      )}
    >
      <div
        className="pointer-events-auto flex w-full justify-center px-4 pb-0.5 md:px-8"
        onPointerDown={isLoaded ? onDockPointerDown : undefined}
        onPointerMove={isLoaded ? onDockPointerMove : undefined}
        onPointerUp={isLoaded ? onDockPointerEnd : undefined}
        onPointerCancel={isLoaded ? onDockPointerEnd : undefined}
        onPointerLeave={(e) => {
          if (isLoaded && e.buttons === 0) onDockPointerEnd();
        }}
      >
        <div
          className="group relative shrink-0"
          style={{
            width: `min(${CONTROL_STRIP_SHELL_WIDTH_REM}rem, calc(100vw - 2rem))`,
          }}
        >
          {isLoaded && secondaryOpen && (
            <div
              className="absolute bottom-full left-8 z-20 mb-2 flex gap-6 border border-border-faint bg-surface-overlay/95 px-4 py-3 shadow-depth backdrop-blur-md transition-[opacity,filter] duration-500 ease-[var(--ease-dissolve)] md:left-12"
              aria-live="polite"
              role="group"
              aria-label="Additional playback options"
            >
              <button
                type="button"
                aria-pressed={mockShuffle}
                title="Shuffle (playlists not available yet)"
                onClick={() => setMockShuffle((v) => !v)}
                className={cn(
                  "text-rune interact-aware cursor-pointer rounded-sm px-2 py-1 outline-none",
                  "focus-visible:ring-1 focus-visible:ring-lunar/50",
                  mockShuffle && "text-membrane-dim",
                )}
              >
                Shuffle
              </button>
              <button
                type="button"
                aria-pressed={mockRepeat}
                title="Repeat (single mode mock)"
                onClick={() => setMockRepeat((v) => !v)}
                className={cn(
                  "text-rune interact-aware cursor-pointer rounded-sm px-2 py-1 outline-none",
                  "focus-visible:ring-1 focus-visible:ring-lunar/50",
                  mockRepeat && "text-membrane-dim",
                )}
              >
                Repeat
              </button>
              <button
                type="button"
                className="text-inscription interact-aware cursor-pointer rounded-sm px-1 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-lunar/50"
                onClick={() => setSecondaryOpen(false)}
              >
                Close
              </button>
            </div>
          )}

          {!isLoaded ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onOpenFile}
                className={cn(
                  "interact-aware flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 outline-none",
                  "focus-visible:ring-1 focus-visible:ring-lunar/50",
                )}
              >
                <GlyphOpen />
                <span className="text-rune tracking-[0.2em]">Open</span>
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-0 px-0.5 py-0.5 transition-colors duration-300 ease-[var(--ease-awareness)]",
              )}
            >
              <div
                className={cn(
                  "flex min-h-7 w-full items-center justify-end gap-1.5 self-center transition-opacity duration-300 ease-[var(--ease-awareness)]",
                  "pointer-events-none justify-self-end opacity-0",
                  "group-hover:pointer-events-auto group-hover:opacity-100",
                  "group-has-[button:focus-visible]:pointer-events-auto group-has-[button:focus-visible]:opacity-100",
                )}
              >
                <QueueSkipButton
                  direction="back"
                  isLoaded={isLoaded}
                  duration={duration}
                  currentTime={currentTime}
                  seek={seek}
                  skipToPrevious={skipToPrevious}
                  skipToNext={skipToNext}
                />
              </div>

              <div
                className={cn(
                  "flex justify-center justify-self-center transition-opacity duration-300 ease-[var(--ease-awareness)]",
                  "pointer-events-none opacity-0",
                  "group-hover:pointer-events-auto group-hover:opacity-100",
                  "group-has-[button:focus-visible]:pointer-events-auto group-has-[button:focus-visible]:opacity-100",
                )}
              >
                <button
                  type="button"
                  aria-pressed={isPlaying}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={() => void toggle()}
                  className={cn(
                    "interact-aware cursor-pointer rounded-sm p-1.5 outline-none",
                    "focus-visible:ring-1 focus-visible:ring-lunar/50",
                  )}
                >
                  <GlyphPlayPause playing={isPlaying} />
                </button>
              </div>

              <div className="flex min-h-7 w-full max-w-full items-center justify-start justify-self-start gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 opacity-0 transition-opacity duration-300 ease-[var(--ease-awareness)]",
                    "pointer-events-none",
                    "group-hover:pointer-events-auto group-hover:opacity-100",
                    "group-has-[button:focus-visible]:pointer-events-auto group-has-[button:focus-visible]:opacity-100",
                  )}
                >
                  <QueueSkipButton
                    direction="forward"
                    isLoaded={isLoaded}
                    duration={duration}
                    currentTime={currentTime}
                    seek={seek}
                    skipToPrevious={skipToPrevious}
                    skipToNext={skipToNext}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
