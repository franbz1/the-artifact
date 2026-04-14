"use client";

import { useEffect, useRef } from "react";

export interface WaveformRefs {
  timeDomain: React.RefObject<Uint8Array<ArrayBuffer> | null>;
  frequency: React.RefObject<Uint8Array<ArrayBuffer> | null>;
  isActive: React.RefObject<boolean>;
}

export function useWaveformData(
  analyserNode: AnalyserNode | null,
  isPlaying: boolean,
): WaveformRefs {
  const timeDomainRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const frequencyRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const isActiveRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    isActiveRef.current = isPlaying && !!analyserNode;

    if (!analyserNode || !isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const bufferLength = analyserNode.frequencyBinCount;

    if (!timeDomainRef.current || timeDomainRef.current.length !== bufferLength) {
      timeDomainRef.current = new Uint8Array(bufferLength);
    }
    if (!frequencyRef.current || frequencyRef.current.length !== bufferLength) {
      frequencyRef.current = new Uint8Array(bufferLength);
    }

    const tick = () => {
      if (!analyserNode) return;

      analyserNode.getByteTimeDomainData(timeDomainRef.current!);
      analyserNode.getByteFrequencyData(frequencyRef.current!);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, isPlaying]);

  return {
    timeDomain: timeDomainRef,
    frequency: frequencyRef,
    isActive: isActiveRef,
  };
}
