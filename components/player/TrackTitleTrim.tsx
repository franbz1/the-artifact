"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { CONTROL_STRIP_TITLE_SLOT_MAX_REM } from "./control-strip.constants";

interface TrackTitleTrimProps {
  text: string;
  className?: string;
  /** Text alignment inside the slot (start = top-left style fixed label). */
  align?: "start" | "end";
  /** Override max width in rem (defaults to CONTROL_STRIP_TITLE_SLOT_MAX_REM). */
  maxWidthRem?: number;
}

/**
 * Narrow inscription slot; long filenames crawl slowly (CSS --track-shift).
 * Remeasures on resize / layout so overflow is detected after hover reveals siblings.
 */
export function TrackTitleTrim({
  text,
  className,
  align = "end",
  maxWidthRem = CONTROL_STRIP_TITLE_SLOT_MAX_REM,
}: TrackTitleTrimProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [shiftPx, setShiftPx] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const overflow = inner.scrollWidth - outer.clientWidth;
      setShiftPx(overflow > 0 ? -overflow : 0);
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(outer);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text]);

  return (
    <div
      ref={outerRef}
      className={cn(
        "min-w-0 overflow-hidden",
        align === "start" ? "text-left" : "text-right",
        className,
      )}
      style={{ maxWidth: `${maxWidthRem}rem` }}
      title={text}
    >
      <span
        ref={innerRef}
        className={cn(
          "inline-block whitespace-nowrap font-mono text-[0.65rem] leading-tight tracking-[0.08em]",
          shiftPx < 0 && "track-title-crawl",
        )}
        style={
          shiftPx < 0
            ? ({ ["--track-shift"]: `${shiftPx}px` } as CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}
