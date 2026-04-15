"use client";

import { useRef } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useWaveformData } from "@/hooks/useWaveformData";
import { Artifact } from "@/components/artifact/Artifact";
import { WaveCanvas } from "./WaveCanvas";
import { DustLight } from "./DustLight";
import { ProgressOverlay } from "./ProgressOverlay";
import { WAVE_STRIP_BOTTOM_CLASS } from "./visualizer.constants";

export function Visualizer() {
  const { analyserNode, isPlaying, currentTime, duration } = useAudio();
  const waveformRefs = useWaveformData(analyserNode, isPlaying);
  const progressRef = useRef(0);
  const progressStripRef = useRef<HTMLDivElement>(null);
  progressRef.current =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  return (
    <>
      <div className="-translate-y-20 md:-translate-y-28 flex justify-center">
        <Artifact />
      </div>

      <WaveCanvas
        waveformRefs={waveformRefs}
        progressRef={progressRef}
        progressStripRef={progressStripRef}
        className={`fixed z-20 ${WAVE_STRIP_BOTTOM_CLASS}`}
      />
      <ProgressOverlay ref={progressStripRef} />
      <DustLight />
    </>
  );
}
