"use client";

import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useAudio } from "@/components/audio/AudioProvider";
import { useIsMobileRef } from "@/hooks/useIsMobile";
import { ArtifactScene } from "./ArtifactScene";

interface ArtifactCanvasProps {
  reduceGpuLoad?: boolean;
}

export function ArtifactCanvas({ reduceGpuLoad = false }: ArtifactCanvasProps) {
  const { analyserNode } = useAudio();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isMobileRef = useIsMobileRef();

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={reduceGpuLoad ? [1, 1] : [1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ArtifactScene analyserRef={analyserRef} isMobileRef={isMobileRef} />
    </Canvas>
  );
}
