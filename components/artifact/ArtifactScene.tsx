"use client";

import { type RefObject } from "react";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ArtifactMesh } from "./ArtifactMesh";

interface ArtifactSceneProps {
  analyserRef: RefObject<AnalyserNode | null>;
}

export function ArtifactScene({ analyserRef }: ArtifactSceneProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 3, 5]} intensity={0.6} color="#d0d4f0" />
      <directionalLight position={[4, -2, -2]} intensity={0.6} color="#1a3d3a" />
      <pointLight position={[0, 4, 3]} intensity={0.3} color="#4a6a48" distance={10} />
      <pointLight position={[-3, -2, 2]} intensity={0.15} color="#2a3a5a" distance={8} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        rotateSpeed={0.6}
        dampingFactor={0.08}
        enableDamping
      />

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
