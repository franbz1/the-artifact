"use client";

import { useRef, type RefObject } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ArtifactMesh } from "./ArtifactMesh";
import { ArtifactCameraZoom } from "./ArtifactCameraZoom";

interface ArtifactSceneProps {
  analyserRef: RefObject<AnalyserNode | null>;
}

export function ArtifactScene({ analyserRef }: ArtifactSceneProps) {
  const rawAmpRef = useRef(0);

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[-5, -4, -2]} intensity={0.6} color="#d0d4f0" />
      <directionalLight position={[5, 4, 1]} intensity={5} color="#3d5c3a" />

      <ArtifactMesh analyserRef={analyserRef} rawAmpOutRef={rawAmpRef} />
      <ArtifactCameraZoom rawAmpInRef={rawAmpRef} />

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.12}
          intensity={0.7}
          luminanceSmoothing={0.6}
        />
      </EffectComposer>
    </>
  );
}
