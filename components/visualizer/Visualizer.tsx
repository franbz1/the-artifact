"use client";

import { useRef } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useWaveformData } from "@/hooks/useWaveformData";
import { Artifact } from "@/components/artifact/Artifact";
import { WaveCanvas } from "./WaveCanvas";
import { DustLight } from "./DustLight";
import { ProgressOverlay } from "./ProgressOverlay";
import {
  ARTIFACT_ZONE_WRAPPER_CLASS,
  WAVE_STRIP_BOTTOM_CLASS,
} from "./visualizer.constants";

interface VisualizerProps {
  /** When true, reduce GPU work (sidebar overlaps WebGL + wave canvas). */
  secondaryPanelOpen?: boolean;
}

export function Visualizer({ secondaryPanelOpen = false }: VisualizerProps) {
  const { analyserNode, isPlaying, currentTime, duration } = useAudio();
  const waveformRefs = useWaveformData(analyserNode, isPlaying);
  const progressRef = useRef(0);
  const progressStripRef = useRef<HTMLDivElement>(null);
  progressRef.current =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  return (
    <>
      <div className={ARTIFACT_ZONE_WRAPPER_CLASS}>
        <div className="pointer-events-auto flex justify-center">
          <Artifact reduceGpuLoad={secondaryPanelOpen} />
        </div>
      </div>

      <WaveCanvas
        waveformRefs={waveformRefs}
        progressRef={progressRef}
        progressStripRef={progressStripRef}
        reduceGpuLoad={secondaryPanelOpen}
        className={`fixed z-20 ${WAVE_STRIP_BOTTOM_CLASS}`}
      />
      <ProgressOverlay ref={progressStripRef} />
      <DustLight />
    </>
  );
}
