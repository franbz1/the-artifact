"use client";

import {
  useCallback,
  useRef,
  useState,
  forwardRef,
  type CSSProperties,
  type MutableRefObject,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  PROGRESS_HANDLE,
  PROGRESS_DOT_TOP_VAR,
  WAVE_CONFIG,
  WAVE_STRIP_BOTTOM_CLASS,
  approximateWaveFillBottomPx,
} from "./visualizer.constants";

interface ProgressOverlayProps {
  className?: string;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as MutableRefObject<T | null>).current = value;
}

/**
 * Transparent hit target over the wave strip for click/drag seek.
 * Handle dot sits at the deepest fill gradient end (Y synced from WaveCanvas via CSS var).
 */
export const ProgressOverlay = forwardRef<HTMLDivElement, ProgressOverlayProps>(
  function ProgressOverlay({ className }, ref) {
    const { seek, duration, isLoaded, currentTime } = useAudio();
    const draggingRef = useRef(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [trackHovered, setTrackHovered] = useState(false);
    const [scrubbing, setScrubbing] = useState(false);

    const showHandle = trackHovered || scrubbing;
    const progressRatio =
      duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

    const setRootNode = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    const seekFromClientX = useCallback(
      (clientX: number) => {
        if (!isLoaded || !duration || duration <= 0 || !rootRef.current) return;
        const rect = rootRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const ratio = Math.min(1, Math.max(0, x / rect.width));
        seek(ratio * duration);
      },
      [duration, isLoaded, seek],
    );

    const onPointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isLoaded || !duration) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        draggingRef.current = true;
        setScrubbing(true);
        seekFromClientX(e.clientX);
      },
      [duration, isLoaded, seekFromClientX],
    );

    const onPointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return;
        seekFromClientX(e.clientX);
      },
      [seekFromClientX],
    );

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = false;
      setScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore if already released */
      }
    }, []);

    const valueNow =
      duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

    const fillBottomFallback = approximateWaveFillBottomPx(WAVE_CONFIG.height);

    return (
      <div
        ref={setRootNode}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valueNow}
        aria-disabled={!isLoaded || !duration}
        tabIndex={isLoaded && duration > 0 ? 0 : -1}
        onPointerEnter={() => setTrackHovered(true)}
        onPointerLeave={() => setTrackHovered(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (!isLoaded || !duration) return;
          const step = duration * 0.05;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            seek(Math.max(0, currentTime - step));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            seek(Math.min(duration, currentTime + step));
          }
        }}
        style={
          {
            height: WAVE_CONFIG.height,
            [PROGRESS_DOT_TOP_VAR]: `${fillBottomFallback}px`,
          } as CSSProperties
        }
        className={cn(
          "fixed z-[21] w-full touch-none",
          WAVE_STRIP_BOTTOM_CLASS,
          isLoaded && duration > 0 && "cursor-pointer",
          "outline-none focus-visible:ring-1 focus-visible:ring-lunar/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
          !isLoaded && "pointer-events-none",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lunar bg-lunar-bright shadow-glow-lunar",
            "transition-opacity duration-300 ease-[var(--ease-awareness)]",
            showHandle ? "opacity-100" : "opacity-0",
          )}
          style={{
            left: `${progressRatio * 100}%`,
            top: `var(${PROGRESS_DOT_TOP_VAR})`,
            width: PROGRESS_HANDLE.diameterPx,
            height: PROGRESS_HANDLE.diameterPx,
          }}
        />
      </div>
    );
  },
);
