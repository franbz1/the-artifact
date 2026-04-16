"use client";

import {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useState,
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
  CURSOR_LIGHT_COLOR,
  SHIVER_CONFIG,
  SHIVER_PLAYBACK_CONFIG,
  CAMERA_ZOOM_CONFIG,
  SPHERE_CONFIG,
  SPHERE_DETAIL_MOBILE,
  MOBILE_AUTO_ROTATE_RAD_PER_SEC,
} from "./artifact.constants";
import { useAudio } from "@/components/audio/AudioProvider";

interface ArtifactMeshProps {
  analyserRef: RefObject<AnalyserNode | null>;
  rawAmpOutRef: MutableRefObject<number>;
  /**
   * Touch / narrow UI source of truth. Read via ref so viewport changes never
   * re-render this component (which lives inside the R3F canvas).
   */
  isMobileRef: RefObject<boolean>;
}

const VISUAL_BUDGET = 1.6;
const CURSOR_LIGHT_INTENSITY = 0.5;
const CURSOR_LIGHT_DISTANCE = 3;
const CURSOR_LIGHT_OFFSET = 0.4;

export function ArtifactMesh({
  analyserRef,
  rawAmpOutRef,
  isMobileRef,
}: ArtifactMeshProps) {
  const { toggle, isPlaying } = useAudio();
  // Captured once at mount. Switching input modes mid-session is not a
  // supported flow; reading the ref at render time would re-enable the prop
  // reactivity we deliberately removed.
  const [isMobile] = useState(() => isMobileRef.current);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const cursorLightRef = useRef<THREE.PointLight>(null);
  const cursorTarget = useRef(new THREE.Vector3(0, 0, 2));
  const cursorSmoothed = useRef(new THREE.Vector3(0, 0, 2));
  const smoothedLightIntensity = useRef(0);
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
  const shiverTimer = useRef(0);
  const shiverPhase = useRef(-1);
  const shiverDir = useRef(new THREE.Vector3(1, 0, 0));
  const shiverNextInterval = useRef(
    SHIVER_CONFIG.minInterval +
      Math.random() * (SHIVER_CONFIG.maxInterval - SHIVER_CONFIG.minInterval),
  );
  const prevRawAmpForShiver = useRef(0);
  const playbackShiverCooldown = useRef(0);
  const pbPhase = useRef(
    new Float32Array(SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves).fill(-1),
  );
  const pbStrength = useRef(
    new Float32Array(SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves),
  );
  const pbDurInv = useRef(
    new Float32Array(SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves),
  );
  const pbSigmaSq2 = useRef(
    new Float32Array(SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves),
  );
  const pbDirs = useRef(
    Array.from({ length: SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves }, () =>
      new THREE.Vector3(1, 0, 0),
    ),
  );
  const { gl } = useThree();

  const onPointerOver = useCallback(() => {
    if (isMobile) return;
    hoveredRef.current = true;
    if (!isDragging.current) gl.domElement.style.cursor = "grab";
  }, [gl, isMobile]);

  const onPointerOut = useCallback(() => {
    if (isMobile) return;
    hoveredRef.current = false;
    if (!isDragging.current) gl.domElement.style.cursor = "";
  }, [gl, isMobile]);

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (isMobile) return;
      if (e.point && e.face && meshRef.current) {
        const worldNormal = e.face.normal
          .clone()
          .transformDirection(meshRef.current.matrixWorld);
        cursorTarget.current
          .copy(e.point)
          .addScaledVector(worldNormal, CURSOR_LIGHT_OFFSET);
      }
    },
    [isMobile],
  );

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      isDragging.current = true;
      exceededDragThreshold.current = false;
      const x = e.nativeEvent.clientX;
      const y = e.nativeEvent.clientY;
      dragStart.current = { x, y };
      prevPointer.current = { x, y };
      if (!isMobile) {
        gl.domElement.style.cursor = "grabbing";
      }
      e.stopPropagation();
    },
    [gl, isMobile],
  );

  useEffect(() => {
    const thresholdSq =
      CLICK_VS_DRAG_THRESHOLD_PX * CLICK_VS_DRAG_THRESHOLD_PX;

    if (isMobile) {
      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        const dxFromStart = e.clientX - dragStart.current.x;
        const dyFromStart = e.clientY - dragStart.current.y;
        if (dxFromStart * dxFromStart + dyFromStart * dyFromStart > thresholdSq) {
          exceededDragThreshold.current = true;
        }
      };

      const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (!exceededDragThreshold.current) {
          void toggle();
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }

    const DRAG_SPEED = 0.006;

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
        new THREE.Vector3(0, 1, 0),
        dx * DRAG_SPEED,
      );
      const qX = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        dy * DRAG_SPEED,
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
  }, [gl, toggle, isMobile]);

  const { geometry, basePositions, directions } = useMemo(() => {
    const detail = isMobile ? SPHERE_DETAIL_MOBILE : SPHERE_CONFIG.detail;
    const geo = createArtifactGeometry(detail);
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
  }, [isMobile]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    const cursorLight = cursorLightRef.current;
    if (!mesh) return;

    clock.current += delta;
    const t = clock.current;

    if (!isMobile) {
      cursorSmoothed.current.lerp(cursorTarget.current, 0.12);
      const intensityTarget = hoveredRef.current ? CURSOR_LIGHT_INTENSITY : 0;
      smoothedLightIntensity.current +=
        (intensityTarget - smoothedLightIntensity.current) * 0.1;
      if (cursorLight) {
        cursorLight.position.copy(cursorSmoothed.current);
        cursorLight.intensity = smoothedLightIntensity.current;
      }
    } else if (cursorLight) {
      cursorLight.intensity = 0;
    }

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

    let shiverWavefront = 0;
    let shiverActive = false;
    const shiverSigmaSq2 =
      2 * SHIVER_CONFIG.waveSigma * SHIVER_CONFIG.waveSigma;

    const rawDelta = rawAmp - prevRawAmpForShiver.current;
    prevRawAmpForShiver.current = rawAmp;

    const zoomDrive = Math.min(
      1,
      Math.max(0, rawAmp) ** CAMERA_ZOOM_CONFIG.zoomDrivePower,
    );

    const pb = pbPhase.current;
    const pbStr = pbStrength.current;
    const pbD = pbDirs.current;
    const pbInv = pbDurInv.current;
    const pbSig = pbSigmaSq2.current;
    const nSlots = SHIVER_PLAYBACK_CONFIG.maxConcurrentWaves;
    const cfg = SHIVER_PLAYBACK_CONFIG;

    for (let s = 0; s < nSlots; s++) {
      if (pb[s]! < 0) continue;
      pb[s]! += delta * pbInv[s]!;
      if (pb[s]! >= 1) {
        pb[s] = -1;
        pbInv[s] = 0;
      }
    }

    if (playbackShiverCooldown.current > 0) {
      playbackShiverCooldown.current -= delta;
    }

    if (
      isPlaying &&
      !idleRest &&
      rawDelta >= SHIVER_PLAYBACK_CONFIG.minRawDelta &&
      playbackShiverCooldown.current <= 0
    ) {
      let free = -1;
      for (let s = 0; s < nSlots; s++) {
        if (pb[s]! < 0) {
          free = s;
          break;
        }
      }
      if (free >= 0) {
        const spikeNorm = Math.min(1, rawDelta / cfg.deltaReference);
        /** Loudness “punch” aligned with camera zoom drive (same curve as ArtifactCameraZoom). */
        const strength =
          (0.08 + 0.92 * spikeNorm) * (0.06 + 0.94 * zoomDrive);
        pbStr[free] = Math.min(1, Math.max(0.06, strength));
        pb[free] = 0;
        const durZoom =
          cfg.microDuration *
          (cfg.microDurationZoomMax +
            (cfg.microDurationZoomMin - cfg.microDurationZoomMax) * zoomDrive);
        const durAttack = durZoom * (1.06 - 0.2 * spikeNorm);
        pbInv[free] = 1 / Math.max(0.12, durAttack);
        const sigma =
          cfg.microWaveSigma *
          (0.9 + 0.1 * (1 - zoomDrive)) *
          (0.94 + 0.06 * (1 - spikeNorm));
        pbSig[free] = 2 * sigma * sigma;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pbD[free]!.set(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi),
        );
        playbackShiverCooldown.current = cfg.spawnCooldown;
      }
    }

    if (shiverPhase.current < 0) {
      if (!isPlaying || idleRest) {
        shiverTimer.current += delta;
        if (shiverTimer.current >= shiverNextInterval.current) {
          shiverPhase.current = 0;
          shiverTimer.current = 0;
          shiverNextInterval.current =
            SHIVER_CONFIG.minInterval +
            Math.random() *
              (SHIVER_CONFIG.maxInterval - SHIVER_CONFIG.minInterval);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          shiverDir.current.set(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi),
          );
        }
      }
    } else {
      shiverPhase.current += delta / SHIVER_CONFIG.duration;
      if (shiverPhase.current >= 1) {
        shiverPhase.current = -1;
      } else {
        shiverActive = true;
        shiverWavefront = -1.3 + shiverPhase.current * 2.6;
      }
    }

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

      let shiverDisp = 0;
      if (shiverActive) {
        const proj =
          bx * shiverDir.current.x +
          by * shiverDir.current.y +
          bz * shiverDir.current.z;
        const dist = proj - shiverWavefront;
        shiverDisp =
          SHIVER_CONFIG.amplitude * Math.exp(-(dist * dist) / shiverSigmaSq2);
      }

      const microAmpBase = cfg.microAmplitude;
      for (let s = 0; s < nSlots; s++) {
        if (pb[s]! < 0) continue;
        const wf = -1.3 + pb[s]! * 2.6;
        const d = pbD[s]!;
        const proj = bx * d.x + by * d.y + bz * d.z;
        const dist = proj - wf;
        const sig2 = pbSig[s]! > 0 ? pbSig[s]! : 2 * cfg.microWaveSigma * cfg.microWaveSigma;
        shiverDisp +=
          microAmpBase *
          pbStr[s]! *
          Math.exp(-(dist * dist) / sig2);
      }

      const totalDisp = idleDisp + primaryDisp + detailDisp + tension + shiverDisp;

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

    if (isMobile) {
      const dq = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        MOBILE_AUTO_ROTATE_RAD_PER_SEC * delta,
      );
      userQuaternion.current.multiply(dq);
    }

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
    <>
      <pointLight
        ref={cursorLightRef}
        color={CURSOR_LIGHT_COLOR}
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
    </>
  );
}
