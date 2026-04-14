"use client";

import { useAudio } from "@/components/audio/AudioProvider";
import { useWaveformData } from "@/hooks/useWaveformData";
import { Artifact } from "@/components/artifact/Artifact";
import { WaveCanvas } from "./WaveCanvas";
import { DustLight } from "./DustLight";

export function Visualizer() {
  const { analyserNode, isPlaying } = useAudio();
  const waveformRefs = useWaveformData(analyserNode, isPlaying);

  return (
    <>
      <div className="-translate-y-10 md:-translate-y-12">
        <Artifact />
      </div>

      <WaveCanvas
        waveformRefs={waveformRefs}
        className="fixed bottom-10 left-0 z-20 md:bottom-12"
      />
      <DustLight />
    </>
  );
}
