export const ARTIFACT_CONTAINER_SIZE = {
  width: "min(90vw, 600px)",
  height: "min(90vh, 600px)",
} as const;

/** Narrow viewports / touch — room for wave strip + transport + safe areas. */
export const ARTIFACT_CONTAINER_SIZE_MOBILE = {
  width: "min(85vw, 340px)",
  height: "min(60vh, 340px)",
} as const;

export const SPHERE_CONFIG = {
  radius: 1.0,
  detail: 14,
} as const;

/** Lower subdivision on mobile for GPU headroom (see createArtifactGeometry). */
export const SPHERE_DETAIL_MOBILE = 11;

/** Slow Y rotation when drag is disabled (radians per second). */
export const MOBILE_AUTO_ROTATE_RAD_PER_SEC = 0.03;

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
  /** Camera Z span from idle (level 0) to full zoom (level 1). Slightly wide for more travel. */
  zoomInAmount: 0.95,
  /** How fast zoom level chases rising loudness (lower = peaks must sustain to reach max). */
  smoothingUp: 0.2,
  /** How fast zoom releases when loudness drops (slightly quicker avoids “stuck” near max). */
  smoothingDown: 0.1,
  /** How fast camera Z eases toward the target distance. */
  response: 0.18,
  idleRetreat: 0.12,
  /**
   * Zoom drive = raw^power (raw ∈ [0,1] from analyser RMS). High power keeps most loud
   * passages in the mid zoom band; only brief peaks near raw≈1 approach full zoom.
   * e.g. power 7 → ~21% drive at 0.8, ~48% at 0.9, ~78% at 0.95, 100% at 1.0.
   */
  zoomDrivePower: 7,
} as const;

export const FIT_SCALE_RESPONSE = 0.08;

export const CLICK_VS_DRAG_THRESHOLD_PX = 8;

/** Cursor-follow point light — same hue as ambient lunar-bright (`--color-lunar-bright`). */
export const CURSOR_LIGHT_COLOR = "#e8945c" as const;

export const SHIVER_CONFIG = {
  /** Minimum seconds between shivers. */
  minInterval: 10,
  /** Maximum seconds between shivers. */
  maxInterval: 15,
  /** Seconds for the wave to cross the full diameter. */
  duration: 2,
  /** Outward displacement of the traveling pulse. */
  amplitude: 0.06,
  /** Gaussian half-width — controls how tight the ripple band is. */
  waveSigma: 0.05,
} as const;

/** Micro ripples during playback: tied to RMS spikes and camera zoom drive (same raw^power curve). */
export const SHIVER_PLAYBACK_CONFIG = {
  /** Min frame-to-frame increase in raw RMS (0–1) to count as an attack. */
  minRawDelta: 0.042,
  /** rawDelta / this → normalized spike strength before capping at 1. */
  deltaReference: 0.13,
  /** Base radius displacement; scaled per wave by strength (smaller than idle SHIVER_CONFIG.amplitude). */
  microAmplitude: 0.022,
  microWaveSigma: 0.088,
  /** Faster than idle shiver so hits read as transient “glitches”. */
  microDuration: 0.38,
  /** Min seconds between spawns (avoids burst noise). */
  spawnCooldown: 0.045,
  maxConcurrentWaves: 5,
} as const;

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
