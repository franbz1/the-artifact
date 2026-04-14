"use client";

import { ArtifactCanvas } from "./ArtifactCanvas";
import { ARTIFACT_CONTAINER_SIZE } from "./artifact.constants";

export function Artifact() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: ARTIFACT_CONTAINER_SIZE.width,
        height: ARTIFACT_CONTAINER_SIZE.height,
      }}
    >
      <ArtifactCanvas />
    </div>
  );
}
