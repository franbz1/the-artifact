"use client";

import { ArtifactCanvas } from "./ArtifactCanvas";
import {
  ARTIFACT_CONTAINER_SIZE,
  ARTIFACT_CONTAINER_SIZE_MOBILE,
} from "./artifact.constants";

interface ArtifactProps {
  reduceGpuLoad?: boolean;
  isMobile?: boolean;
}

export function Artifact({
  reduceGpuLoad = false,
  isMobile = false,
}: ArtifactProps) {
  const size = isMobile ? ARTIFACT_CONTAINER_SIZE_MOBILE : ARTIFACT_CONTAINER_SIZE;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      <ArtifactCanvas reduceGpuLoad={reduceGpuLoad} isMobile={isMobile} />
    </div>
  );
}
