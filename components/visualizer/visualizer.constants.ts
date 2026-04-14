// -- Wave Canvas --

export const WAVE_CONFIG = {
  height: 148,
  /** Fraction of canvas height reserved as empty margin top + bottom so peaks stay visible */
  verticalPaddingRatio: 0.16,
  /** Max fraction of inner height used for wave displacement (rest is breathing room) */
  peakHeightRatio: 0.42,
  /**
   * How far below the lowest point of the wave (largest Y) the fill + gradient extend,
   * as a fraction of total canvas height. Smaller = shorter / tighter glow downward.
   */
  fillGradientExtendRatio: 0.14,
  smoothing: 0.10,
  drawPoints: 128,
  idleSineSpeed: 0.0003,
} as const;

// Frequency bands — each rendered as its own wave, all layered at the same vertical center.
// binStart/binEnd are fractions of frequencyBinCount (0-1).
export const FREQUENCY_BANDS = [
  {
    name: "sub-bass",
    binStart: 0,
    binEnd: 0.012,       // ~0-250 Hz
    color: "46, 74, 43",        // lunar-deep
    opacity: 0.6,
    fillOpacity: 0.08,
    lineWidth: 2.4,
    amplitudeScale: 1.8,
    idleFreq: 0.003,
    idleAmp: 1.5,
  },
  {
    name: "low-mid",
    binStart: 0.012,
    binEnd: 0.09,         // ~250-2000 Hz
    color: "61, 92, 58",        // lunar
    opacity: 0.48,
    fillOpacity: 0.06,
    lineWidth: 1.6,
    amplitudeScale: 1.4,
    idleFreq: 0.007,
    idleAmp: 1.0,
  },
  {
    name: "high-mid",
    binStart: 0.09,
    binEnd: 0.28,         // ~2000-6000 Hz
    color: "26, 61, 58",        // teal-glow
    opacity: 0.38,
    fillOpacity: 0.04,
    lineWidth: 1.0,
    amplitudeScale: 1.1,
    idleFreq: 0.013,
    idleAmp: 0.7,
  },
  {
    name: "highs",
    binStart: 0.28,
    binEnd: 0.9,          // ~6000-20000 Hz
    color: "160, 168, 208",     // membrane-dim
    opacity: 0.28,
    fillOpacity: 0.03,
    lineWidth: 0.6,
    amplitudeScale: 0.7,
    idleFreq: 0.025,
    idleAmp: 0.4,
  },
] as const;

// -- Dust Light (upper-right corner light beam with floating dust) --

export const DUST_LIGHT_CONFIG = {
  particleCount: 25,
  beamAngle: -2.2,
  beamSpread: 0.5,
  particleMinRadius: 0.6,
  particleMaxRadius: 2.0,
  particleMinSpeed: 0.08,
  particleMaxSpeed: 0.3,
  particleMinOpacity: 0.03,
  particleMaxOpacity: 0.18,
  opacityCycleSpeed: 0.0008,
  driftStrength: 0.008,
  audioBoost: 0.06,
  color: "200, 204, 232",      // membrane
  colorDim: "160, 168, 208",   // membrane-dim
  gradientColor: "61, 92, 58", // lunar
  gradientOpacity: 0.04,
} as const;

// -- Default Song --

export const DEFAULT_SONG_URL = "/music/Let's Get Blown.mp3";
