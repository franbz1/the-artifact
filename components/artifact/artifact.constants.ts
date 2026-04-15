export const ARTIFACT_CONTAINER_SIZE = {
  width: "min(90vw, 600px)",
  height: "min(90vh, 600px)",
} as const;

export const SPHERE_CONFIG = {
  radius: 1.0,
  detail: 14,
} as const;

export const PERF_CONFIG = {
  normalUpdateStride: 2,
  normalUpdateStrideIdle: 4,
  idleAmpThreshold: 0.028,

  amplitudeSampleStride: 4,
  simplexLayersAmpGate: 0.045,
} as const;

export const IDLE_CONFIG = {
  baseDeform: 0.035,
  noiseFrequency: 0.55,
  timeSpeed: 0.1,
} as const;

export const AUDIO_CONFIG = {
  spikeNoiseFreq: 1.42,
  spikeTimeSpeed: 0.3,
  spikeScale: 0.47,
  spikeSharpness: 2.75,

  detailNoiseFreq: 3.15,
  detailScale: 0.12,
  detailSharpness: 2.0,

  surfaceTension: 0.04,

  smoothingUp: 0.18,
  smoothingDown: 0.04,
  amplitudeGain: 4.5,
  amplitudeMax: 1.0,
} as const;

export const CAMERA_ZOOM_CONFIG = {
  baseDistance: 4.0,
  zoomInAmount: 0.85,
  smoothingUp: 0.52,
  smoothingDown: 0.14,
  response: 0.26,
  idleRetreat: 0.12,
} as const;

export const FIT_SCALE_RESPONSE = 0.08;

export const CLICK_VS_DRAG_THRESHOLD_PX = 8;

export const MATERIAL_CONFIG = {
  /** Warm umber-black albedo (not neutral #000 — reads as black in scene light). */
  color: "#0e0c0a",
  roughness: 0.55,
  metalness: 0.92,
  clearcoat: 0.18,
  clearcoatRoughness: 0.6,
  emissiveColor: "#c45c32",
  emissiveIdle: 0.0,
  emissivePeak: 0.009,
} as const;
