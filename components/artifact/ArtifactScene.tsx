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
      <directionalLight position={[-5, -4, -2]} intensity={0.65} color="#e8dfd4" />
      <directionalLight position={[5, 4, 1]} intensity={4.2} color="#e8945c" />

      <ArtifactMesh analyserRef={analyserRef} rawAmpOutRef={rawAmpRef} />
      <ArtifactCameraZoom rawAmpInRef={rawAmpRef} />

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.2} intensity={0.38} luminanceSmoothing={0.55} />
      </EffectComposer>
    </>
  );
}
