"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useAudioEngine, type AudioEngine } from "@/hooks/useAudioEngine";
import { useAmplitude } from "@/hooks/useAmplitude";

interface AudioContextValue extends AudioEngine {
  amplitude: number;
  peak: number;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useAudioEngine();
  const { amplitude, peak } = useAmplitude(engine.analyserNode, engine.isPlaying);

  return (
    <AudioCtx.Provider value={{ ...engine, amplitude, peak }}>
      {children}
    </AudioCtx.Provider>
  );
}
