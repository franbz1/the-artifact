"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudio } from "@/components/audio/AudioProvider";
import { CAMERA_ZOOM_CONFIG } from "./artifact.constants";

interface ArtifactCameraZoomProps {
  /** Filled by ArtifactMesh each frame (single analyser RMS pass) */
  rawAmpInRef: MutableRefObject<number>;
}

export function ArtifactCameraZoom({ rawAmpInRef }: ArtifactCameraZoomProps) {
  const { camera } = useThree();
  const { isPlaying } = useAudio();
  const zoomLevelRef = useRef(0);
  const zSmoothedRef = useRef(CAMERA_ZOOM_CONFIG.baseDistance);

  // Priority 1 so ArtifactMesh (default 0) writes rawAmp before we read it
  useFrame(() => {
    const raw = isPlaying ? rawAmpInRef.current : 0;
    const zr = zoomLevelRef.current;
    const up = CAMERA_ZOOM_CONFIG.smoothingUp;
    const down = CAMERA_ZOOM_CONFIG.smoothingDown;
    const idle = CAMERA_ZOOM_CONFIG.idleRetreat;

    const zoomTarget = Math.min(
      1,
      Math.max(0, raw) ** CAMERA_ZOOM_CONFIG.zoomDrivePower,
    );

    if (!isPlaying) {
      zoomLevelRef.current = zr + (0 - zr) * idle;
    } else {
      zoomLevelRef.current =
        zoomTarget > zr
          ? zr + (zoomTarget - zr) * up
          : zr + (zoomTarget - zr) * down;
    }

    const level = zoomLevelRef.current;
    const targetZ =
      CAMERA_ZOOM_CONFIG.baseDistance - level * CAMERA_ZOOM_CONFIG.zoomInAmount;
    zSmoothedRef.current +=
      (targetZ - zSmoothedRef.current) * CAMERA_ZOOM_CONFIG.response;

    camera.position.z = zSmoothedRef.current;
  }, 1);

  return null;
}
