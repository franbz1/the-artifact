"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AmplitudeData {
  amplitude: number;
  peak: number;
}

const SMOOTHING_FACTOR = 0.08;
const PEAK_DECAY = 0.02;
const IDLE_AMPLITUDE = 0;

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

export function useAmplitude(
  analyserNode: AnalyserNode | null,
  isPlaying: boolean,
): AmplitudeData {
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef(IDLE_AMPLITUDE);
  const peakRef = useRef(IDLE_AMPLITUDE);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  const [data, setData] = useState<AmplitudeData>({
    amplitude: IDLE_AMPLITUDE,
    peak: IDLE_AMPLITUDE,
  });

  const computeRms = useCallback((buffer: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = (buffer[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / buffer.length);
  }, []);

  useEffect(() => {
    if (prefersReduced) {
      setData({ amplitude: 0.5, peak: 0.5 });
      return;
    }

    if (!analyserNode || !isPlaying) {
      smoothedRef.current = IDLE_AMPLITUDE;
      peakRef.current = IDLE_AMPLITUDE;
      setData({ amplitude: IDLE_AMPLITUDE, peak: IDLE_AMPLITUDE });
      return;
    }

    if (!dataArrayRef.current || dataArrayRef.current.length !== analyserNode.fftSize) {
      dataArrayRef.current = new Uint8Array(analyserNode.fftSize);
    }

    const tick = () => {
      const buffer = dataArrayRef.current!;
      analyserNode.getByteTimeDomainData(buffer);

      const rawRms = computeRms(buffer);
      const clamped = Math.min(rawRms * 3.5, 1.0);

      smoothedRef.current += (clamped - smoothedRef.current) * SMOOTHING_FACTOR;

      if (smoothedRef.current > peakRef.current) {
        peakRef.current = smoothedRef.current;
      } else {
        peakRef.current = Math.max(
          peakRef.current - PEAK_DECAY,
          smoothedRef.current,
        );
      }

      setData({
        amplitude: smoothedRef.current,
        peak: peakRef.current,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, isPlaying, computeRms, prefersReduced]);

  return data;
}
