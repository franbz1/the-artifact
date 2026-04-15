"use client";

import {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  type RefObject,
  type MutableRefObject,
} from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { createArtifactGeometry, simplex3 } from "./artifact.geometry";
import {
  IDLE_CONFIG,
  AUDIO_CONFIG,
  MATERIAL_CONFIG,
  PERF_CONFIG,
  FIT_SCALE_RESPONSE,
  CLICK_VS_DRAG_THRESHOLD_PX,
} from "./artifact.constants";
import { useAudio } from "@/components/audio/AudioProvider";

interface ArtifactMeshProps {
  analyserRef: RefObject<AnalyserNode | null>;
  rawAmpOutRef: MutableRefObject<number>;
}

const VISUAL_BUDGET = 1.6;

export function ArtifactMesh({ analyserRef, rawAmpOutRef }: ArtifactMeshProps) {
  const { toggle } = useAudio();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const smoothedAmp = useRef(0);
  const smoothedFitScale = useRef(1);
  const dataArray = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const clock = useRef(0);
  const userQuaternion = useRef(new THREE.Quaternion());
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const exceededDragThreshold = useRef(false);
  const hoveredRef = useRef(false);
  const wobbleEuler = useRef(new THREE.Euler());
  const wobbleQuat = useRef(new THREE.Quaternion());
  const normalFrameCounter = useRef(0);
  const { gl } = useThree();

  const onPointerOver = useCallback(() => {
    hoveredRef.current = true;
    if (!isDragging.current) gl.domElement.style.cursor = "grab";
  }, [gl]);

  const onPointerOut = useCallback(() => {
    hoveredRef.current = false;
    if (!isDragging.current) gl.domElement.style.cursor = "";
  }, [gl]);

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    isDragging.current = true;
    exceededDragThreshold.current = false;
    const x = e.nativeEvent.clientX;
    const y = e.nativeEvent.clientY;
    dragStart.current = { x, y };
    prevPointer.current = { x, y };
    gl.domElement.style.cursor = "grabbing";
    e.stopPropagation();
  }, [gl]);

  useEffect(() => {
    const DRAG_SPEED = 0.006;
    const thresholdSq =
      CLICK_VS_DRAG_THRESHOLD_PX * CLICK_VS_DRAG_THRESHOLD_PX;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dxFromStart = e.clientX - dragStart.current.x;
      const dyFromStart = e.clientY - dragStart.current.y;
      if (dxFromStart * dxFromStart + dyFromStart * dyFromStart > thresholdSq) {
        exceededDragThreshold.current = true;
      }
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      const qY = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), dx * DRAG_SPEED,
      );
      const qX = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), dy * DRAG_SPEED,
      );
      userQuaternion.current.premultiply(qY).premultiply(qX);
    };

    const handlePointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (!exceededDragThreshold.current) {
        void toggle();
      }
      gl.domElement.style.cursor = hoveredRef.current ? "grab" : "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [gl, toggle]);

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
    if (!mesh) return;

    clock.current += delta;
    const t = clock.current;

    let rawAmp = 0;
    const analyser = analyserRef.current;
    if (analyser) {
      if (!dataArray.current || dataArray.current.length !== analyser.fftSize) {
        dataArray.current = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteTimeDomainData(dataArray.current);

      const buf = dataArray.current;
      const step = PERF_CONFIG.amplitudeSampleStride;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < buf.length; i += step) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
        n++;
      }
      rawAmp = Math.min(
        Math.sqrt(sum / n) * AUDIO_CONFIG.amplitudeGain,
        AUDIO_CONFIG.amplitudeMax,
      );
    }

    rawAmpOutRef.current = rawAmp;

    const smoothing = rawAmp > smoothedAmp.current
      ? AUDIO_CONFIG.smoothingUp
      : AUDIO_CONFIG.smoothingDown;
    smoothedAmp.current += (rawAmp - smoothedAmp.current) * smoothing;
    const amp = smoothedAmp.current;

    const idleRest =
      amp < PERF_CONFIG.idleAmpThreshold && rawAmp < PERF_CONFIG.idleAmpThreshold * 1.35;
    const normalStride = idleRest
      ? PERF_CONFIG.normalUpdateStrideIdle
      : PERF_CONFIG.normalUpdateStride;
    const skipSpikeSimplex = idleRest;

    const posAttr = mesh.geometry.getAttribute("position");
    const positions = posAttr.array as Float32Array;
    let maxRadius = 0;

    const idleFreq = IDLE_CONFIG.noiseFrequency;
    const af = AUDIO_CONFIG.spikeNoiseFreq;
    const at = t * AUDIO_CONFIG.spikeTimeSpeed;
    const df = AUDIO_CONFIG.detailNoiseFreq;
    const spikeSharp = AUDIO_CONFIG.spikeSharpness;
    const detailSharp = AUDIO_CONFIG.detailSharpness;
    const useFullLayers = amp >= PERF_CONFIG.simplexLayersAmpGate;

    for (let i = 0; i < posAttr.count; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];
      const dirX = directions[i3];
      const dirY = directions[i3 + 1];
      const dirZ = directions[i3 + 2];

      const idleNoise = simplex3(
        bx * idleFreq + t * IDLE_CONFIG.timeSpeed,
        by * idleFreq + t * IDLE_CONFIG.timeSpeed * 0.7,
        bz * idleFreq,
      );
      const idleDisp = idleNoise * IDLE_CONFIG.baseDeform;

      let rawSpike: number;
      if (skipSpikeSimplex) {
        rawSpike = 0;
      } else {
        const spike1 = simplex3(bx * af + at, by * af, bz * af + at * 0.6);
        if (useFullLayers) {
          const spike2 = simplex3(
            bx * af * 2.1 + 77,
            by * af * 2.1 + at * 0.5 + 77,
            bz * af * 2.1 + 77,
          );
          rawSpike = spike1 * 0.6 + spike2 * 0.4;
        } else {
          rawSpike = spike1;
        }
      }

      const clampedSpike = rawSpike > 0 ? rawSpike : 0;
      const sharpSpike =
        clampedSpike * clampedSpike * (spikeSharp > 2 ? clampedSpike : 1);
      const primaryDisp = sharpSpike * amp * AUDIO_CONFIG.spikeScale;

      let detailDisp = 0;
      if (!skipSpikeSimplex && useFullLayers) {
        const detailNoise = simplex3(
          bx * df + at * 1.2,
          by * df + 200,
          bz * df + at * 0.8,
        );
        const clampedDetail = detailNoise > 0 ? detailNoise : 0;
        const sharpDetail =
          clampedDetail * clampedDetail * (detailSharp > 1 ? 1 : clampedDetail);
        detailDisp = sharpDetail * amp * AUDIO_CONFIG.detailScale;
      }

      const tension = -AUDIO_CONFIG.surfaceTension * amp * (1 - clampedSpike);

      const totalDisp = idleDisp + primaryDisp + detailDisp + tension;

      const px = bx + dirX * totalDisp;
      const py = by + dirY * totalDisp;
      const pz = bz + dirZ * totalDisp;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      const r = px * px + py * py + pz * pz;
      if (r > maxRadius) maxRadius = r;
    }

    maxRadius = Math.sqrt(maxRadius);

    posAttr.needsUpdate = true;
    const nf = normalFrameCounter.current;
    normalFrameCounter.current = nf + 1;
    if (nf % normalStride === 0) {
      mesh.geometry.computeVertexNormals();
    }

    const safeRadius = Math.max(maxRadius, 1e-6);
    const targetFitScale = Math.min(1.0, VISUAL_BUDGET / safeRadius);
    smoothedFitScale.current +=
      (targetFitScale - smoothedFitScale.current) * FIT_SCALE_RESPONSE;
    mesh.scale.setScalar(smoothedFitScale.current);

    wobbleEuler.current.set(
      Math.sin(t * 0.18) * 0.05,
      Math.sin(t * 0.14) * 0.035,
      0,
    );
    wobbleQuat.current.setFromEuler(wobbleEuler.current);
    mesh.quaternion.copy(userQuaternion.current).multiply(wobbleQuat.current);

    if (material) {
      material.emissiveIntensity =
        MATERIAL_CONFIG.emissiveIdle +
        amp * (MATERIAL_CONFIG.emissivePeak - MATERIAL_CONFIG.emissiveIdle);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
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
  );
}
