"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useAudioEngine, type AudioEngine } from "@/hooks/useAudioEngine";
import { useAmplitude } from "@/hooks/useAmplitude";
import {
  usePlaybackQueue,
  type PlaybackQueueApi,
} from "@/hooks/usePlaybackQueue";

interface AudioContextValue extends AudioEngine, PlaybackQueueApi {
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
  const mediaEndedRef = useRef<(() => void) | null>(null);
  const engine = useAudioEngine({
    onMediaEnded: () => {
      mediaEndedRef.current?.();
    },
  });
  const queue = usePlaybackQueue({
    loadFile: engine.loadFile,
    loadUrl: engine.loadUrl,
    play: engine.play,
    clearPlayback: engine.clearPlayback,
    mediaEndedRef,
  });
  const { amplitude, peak } = useAmplitude(engine.analyserNode, engine.isPlaying);

  return (
    <AudioCtx.Provider
      value={{ ...engine, ...queue, amplitude, peak }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
