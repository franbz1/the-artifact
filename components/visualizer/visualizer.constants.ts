// -- Progress tonal split (played vs unplayed wave) --

export const PROGRESS_CONFIG = {
  /** Multiply base stroke opacity for the played overlay (capped at 1 in render). */
  playedOpacityMultiplier: 1.5,
  /** Multiply base fill opacity for the played overlay (capped at 1 in render). */
  playedFillMultiplier: 2.0,
  /** Blend factor toward lunar RGB for played stroke/fill (0 = band color only). */
  lunarTintBlend: 0.35,
  /** Lunar accent — matches --color-lunar */
  lunarRgb: "61, 92, 58",
} as const;

/** Seek handle on the progress strip (DOM overlay, not canvas). */
export const PROGRESS_HANDLE = {
  /** Outer diameter (w/h) in px — hit area uses slightly larger padding in CSS. */
  diameterPx: 12,
} as const;

/** CSS custom property set by WaveCanvas each frame — Y from top of strip to gradient end. */
export const PROGRESS_DOT_TOP_VAR = "--progress-dot-top";

/**
 * Approximate Y (px from top of wave strip) where fill gradients end — used as fallback before the first frame.
 */
export function approximateWaveFillBottomPx(
  canvasCssHeight: number = WAVE_CONFIG.height,
): number {
  const padY = canvasCssHeight * WAVE_CONFIG.verticalPaddingRatio;
  const innerH = canvasCssHeight - padY * 2;
  const midY = padY + innerH * 0.5;
  const peakRange = innerH * WAVE_CONFIG.peakHeightRatio;
  const approxWaveMaxY = midY + peakRange;
  return Math.min(
    canvasCssHeight,
    approxWaveMaxY + canvasCssHeight * WAVE_CONFIG.fillGradientExtendRatio,
  );
}

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

/**
 * Wave + seek strip anchor — shared by WaveCanvas and ProgressOverlay.
 * Higher values = more room below for controls (must stay in sync).
 */
export const WAVE_STRIP_BOTTOM_CLASS =
  "bottom-24 left-0 md:bottom-32" as const;

/**
 * Control cluster: fixed above the viewport bottom, tucked under the wave strip
 * (see WAVE_STRIP_BOTTOM_CLASS — keep ~0.5rem gap between anchors).
 */
export const CONTROL_STRIP_DOCK_CLASS =
  "bottom-[5.5rem] left-0 right-0 md:bottom-[7.5rem]" as const;

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
