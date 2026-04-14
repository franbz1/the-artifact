"use client";

import { useRef, useMemo, useState, useCallback, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { createArtifactGeometry, simplex3 } from "./artifact.geometry";
import {
  IDLE_CONFIG,
  AUDIO_CONFIG,
  MATERIAL_CONFIG,
} from "./artifact.constants";

interface ArtifactMeshProps {
  analyserRef: RefObject<AnalyserNode | null>;
}

const VISUAL_BUDGET = 1.35;
const CURSOR_LIGHT_INTENSITY = 0.5;
const CURSOR_LIGHT_DISTANCE = 3;
const CURSOR_LIGHT_OFFSET = 0.4;

export function ArtifactMesh({ analyserRef }: ArtifactMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const cursorLightRef = useRef<THREE.PointLight>(null);
  const smoothedAmp = useRef(0);
  const smoothedScale = useRef(1);
  const smoothedLightIntensity = useRef(0);
  const cursorTarget = useRef(new THREE.Vector3(0, 0, 2));
  const cursorSmoothed = useRef(new THREE.Vector3(0, 0, 2));
  const dataArray = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const clock = useRef(0);
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();

  const onPointerOver = useCallback(() => {
    setHovered(true);
    gl.domElement.style.cursor = "grab";
  }, [gl]);

  const onPointerOut = useCallback(() => {
    setHovered(false);
    gl.domElement.style.cursor = "";
  }, [gl]);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.point && e.face) {
      cursorTarget.current.copy(e.point).addScaledVector(e.face.normal, CURSOR_LIGHT_OFFSET);
    }
  }, []);

  const { geometry, basePositions, directions } = useMemo(() => {
    const geo = createArtifactGeometry();
    const posAttr = geo.getAttribute("position");

    const base = new Float32Array(posAttr.array);

    const dirs = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const i3 = i * 3;
      const x = base[i3];
      const y = base[i3 + 1];
      const z = base[i3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      dirs[i3] = x / len;
      dirs[i3 + 1] = y / len;
      dirs[i3 + 2] = z / len;
    }

    return { geometry: geo, basePositions: base, directions: dirs };
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    const cursorLight = cursorLightRef.current;
    if (!mesh) return;

    clock.current += delta;
    const t = clock.current;

    // Smooth cursor light position and intensity
    cursorSmoothed.current.lerp(cursorTarget.current, 0.12);
    const intensityTarget = hovered ? CURSOR_LIGHT_INTENSITY : 0;
    smoothedLightIntensity.current += (intensityTarget - smoothedLightIntensity.current) * 0.1;

    if (cursorLight) {
      cursorLight.position.copy(cursorSmoothed.current);
      cursorLight.intensity = smoothedLightIntensity.current;
    }

    let rawAmp = 0;
    const analyser = analyserRef.current;
    if (analyser) {
      if (!dataArray.current || dataArray.current.length !== analyser.fftSize) {
        dataArray.current = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteTimeDomainData(dataArray.current);

      let sum = 0;
      for (let i = 0; i < dataArray.current.length; i++) {
        const v = (dataArray.current[i] - 128) / 128;
        sum += v * v;
      }
      rawAmp = Math.min(
        Math.sqrt(sum / dataArray.current.length) * AUDIO_CONFIG.amplitudeGain,
        AUDIO_CONFIG.amplitudeMax,
      );
    }

    const smoothing = rawAmp > smoothedAmp.current
      ? AUDIO_CONFIG.smoothingUp
      : AUDIO_CONFIG.smoothingDown;
    smoothedAmp.current += (rawAmp - smoothedAmp.current) * smoothing;
    const amp = smoothedAmp.current;

    const posAttr = mesh.geometry.getAttribute("position");
    const positions = posAttr.array as Float32Array;
    let maxRadius = 0;

    for (let i = 0; i < posAttr.count; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];
      const dx = directions[i3];
      const dy = directions[i3 + 1];
      const dz = directions[i3 + 2];

      const idleFreq = IDLE_CONFIG.noiseFrequency;
      const idle1 = simplex3(
        bx * idleFreq + t * IDLE_CONFIG.timeSpeed,
        by * idleFreq,
        bz * idleFreq + t * IDLE_CONFIG.timeSpeed * 0.7,
      );
      const idle2 = simplex3(
        bx * idleFreq * 2.1 + 100,
        by * idleFreq * 2.1 + 100,
        bz * idleFreq * 2.1 + t * IDLE_CONFIG.timeSpeed * 1.3,
      );
      const idleDisp = (idle1 * 0.7 + idle2 * 0.3) * IDLE_CONFIG.baseDeform;

      const af = AUDIO_CONFIG.spikeNoiseFreq;
      const at = t * AUDIO_CONFIG.spikeTimeSpeed;
      const audio1 = simplex3(bx * af + at, by * af, bz * af);
      const audio2 = simplex3(
        bx * af * 2.3 + at * 0.8 + 50,
        by * af * 2.3 + 50,
        bz * af * 2.3 + 50,
      );
      const audioNoise = audio1 * 0.65 + audio2 * 0.35;
      const biased = audioNoise * 0.4 + 0.6;
      const audioDisp = biased * amp * AUDIO_CONFIG.spikeScale;

      const totalDisp = idleDisp + audioDisp;

      const px = bx + dx * totalDisp;
      const py = by + dy * totalDisp;
      const pz = bz + dz * totalDisp;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      const r = Math.sqrt(px * px + py * py + pz * pz);
      if (r > maxRadius) maxRadius = r;
    }

    posAttr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    const targetScale = maxRadius > VISUAL_BUDGET
      ? VISUAL_BUDGET / maxRadius
      : 1.0;
    smoothedScale.current += (targetScale - smoothedScale.current) * 0.06;
    mesh.scale.setScalar(smoothedScale.current);

    mesh.rotation.x = Math.sin(t * 0.12) * 0.03;

    if (material) {
      material.emissiveIntensity =
        MATERIAL_CONFIG.emissiveIdle +
        amp * (MATERIAL_CONFIG.emissivePeak - MATERIAL_CONFIG.emissiveIdle);
    }
  });

  return (
    <>
      <pointLight
        ref={cursorLightRef}
        color="#c8d4e0"
        intensity={0}
        distance={CURSOR_LIGHT_DISTANCE}
        decay={2}
      />
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onPointerMove={onPointerMove}
      >
        <meshPhysicalMaterial
          ref={materialRef}
          color={MATERIAL_CONFIG.color}
          roughness={MATERIAL_CONFIG.roughness}
          metalness={MATERIAL_CONFIG.metalness}
          clearcoat={MATERIAL_CONFIG.clearcoat}
          clearcoatRoughness={MATERIAL_CONFIG.clearcoatRoughness}
          emissive={MATERIAL_CONFIG.emissiveColor}
          emissiveIntensity={MATERIAL_CONFIG.emissiveIdle}
          flatShading={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </>
  );
}
