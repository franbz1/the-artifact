export const ARTIFACT_CONTAINER_SIZE = {
  width: "min(90vw, 600px)",
  height: "min(90vh, 600px)",
} as const;

export const SPHERE_CONFIG = {
  radius: 1.0,
  detail: 8,
} as const;

export const IDLE_CONFIG = {
  baseDeform: 0.04,
  noiseFrequency: 0.45,
  timeSpeed: 0.1,
} as const;

export const AUDIO_CONFIG = {
  spikeScale: 0.5,
  spikeNoiseFreq: 0.7,
  spikeTimeSpeed: 0.35,
  smoothingUp: 0.12,
  smoothingDown: 0.03,
  amplitudeGain: 4.0,
  amplitudeMax: 1.0,
} as const;

export const MATERIAL_CONFIG = {
  color: "#080a0f",
  roughness: 0.7,
  metalness: 0.85,
  clearcoat: 0.12,
  clearcoatRoughness: 0.8,
  emissiveColor: "#1a2e1a",
  emissiveIdle: 0.0,
  emissivePeak: 0.15,
} as const;
