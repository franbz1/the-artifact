"use client";

import { useEffect, useRef, useState } from "react";
import { MOBILE_MAX_WIDTH_PX } from "@/lib/mobile.constants";

function queryIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * True when the viewport is treated as mobile: coarse pointer (touch-primary) or
 * narrow width. SSR / first paint: false to match server markup.
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const mqCoarse = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      setMobile(mqWidth.matches || mqCoarse.matches);
    };

    sync();
    mqWidth.addEventListener("change", sync);
    mqCoarse.addEventListener("change", sync);
    return () => {
      mqWidth.removeEventListener("change", sync);
      mqCoarse.removeEventListener("change", sync);
    };
  }, []);

  return mobile;
}

/**
 * Ref version for hot-loop readers (useFrame, canvas children) that must
 * never cause React re-renders when the value flips.
 */
export function useIsMobileRef(): React.RefObject<boolean> {
  const ref = useRef(queryIsMobile());

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const mqCoarse = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      ref.current = mqWidth.matches || mqCoarse.matches;
    };

    sync();
    mqWidth.addEventListener("change", sync);
    mqCoarse.addEventListener("change", sync);
    return () => {
      mqWidth.removeEventListener("change", sync);
      mqCoarse.removeEventListener("change", sync);
    };
  }, []);

  return ref;
}
