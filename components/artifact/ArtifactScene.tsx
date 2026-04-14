"use client";

import { type RefObject } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ArtifactMesh } from "./ArtifactMesh";

interface ArtifactSceneProps {
  analyserRef: RefObject<AnalyserNode | null>;
}

export function ArtifactScene({ analyserRef }: ArtifactSceneProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[-5, -4, -2]} intensity={0.6} color="#d0d4f0" />
      <directionalLight position={[5, 4, 1]} intensity={5} color="#3d5c3a" />

      <ArtifactMesh analyserRef={analyserRef} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.12}
          intensity={0.7}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
