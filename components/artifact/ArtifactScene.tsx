"use client";

import { useRef, type RefObject } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ArtifactMesh } from "./ArtifactMesh";
import { ArtifactCameraZoom } from "./ArtifactCameraZoom";

interface ArtifactSceneProps {
  analyserRef: RefObject<AnalyserNode | null>;
  isMobileRef: RefObject<boolean>;
}

export function ArtifactScene({
  analyserRef,
  isMobileRef,
}: ArtifactSceneProps) {
  const rawAmpRef = useRef(0);

  return (
    <>
      {/* Ambient kept minimal so form reads from key/fill only (was 0.15). */}
      <ambientLight intensity={0.03} />
      <directionalLight position={[-5, -4, -2]} intensity={0.78} color="#e8dfd4" />
      <directionalLight position={[5, 4, 1]} intensity={4.2} color="#e8945c" />

      <ArtifactMesh
        analyserRef={analyserRef}
        rawAmpOutRef={rawAmpRef}
        isMobileRef={isMobileRef}
      />
      <ArtifactCameraZoom rawAmpInRef={rawAmpRef} />

      {/* EffectComposer is kept on every device — without it the render target
          / tone mapping path changes and the mesh becomes invisible on some
          mobile GPUs. Bloom itself is cheap compared to losing the artifact. */}
      <EffectComposer multisampling={3}>
        <Bloom luminanceThreshold={0.2} intensity={0.38} luminanceSmoothing={0.55} />
      </EffectComposer>
    </>
  );
}
