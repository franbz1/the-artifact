"use client";

import { ArtifactCanvas } from "./ArtifactCanvas";
import { ARTIFACT_CONTAINER_SIZE } from "./artifact.constants";

interface ArtifactProps {
  reduceGpuLoad?: boolean;
}

export function Artifact({ reduceGpuLoad = false }: ArtifactProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: ARTIFACT_CONTAINER_SIZE.width,
        height: ARTIFACT_CONTAINER_SIZE.height,
      }}
    >
      <ArtifactCanvas reduceGpuLoad={reduceGpuLoad} />
    </div>
  );
}
