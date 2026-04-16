// -- Progress tonal split (played vs unplayed wave) --

export const PROGRESS_CONFIG = {
  /** Multiply base stroke opacity for the played overlay (capped at 1 in render). */
  playedOpacityMultiplier: 1.5,
  /** Multiply base fill opacity for the played overlay (capped at 1 in render). */
  playedFillMultiplier: 2.0,
  /** Blend factor toward lunar RGB for played stroke/fill (0 = band color only). */
  lunarTintBlend: 0.35,
  /** Accent tint — matches --color-lunar (terracotta) */
  lunarRgb: "196, 92, 50",
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
 * Bottom offset is the distance from the viewport bottom; keep ~0.5rem above
 * CONTROL_STRIP_DOCK_CLASS so the strip clears the controls (must stay in sync).
 */
export const WAVE_STRIP_BOTTOM_CLASS =
  "bottom-[1.5rem] left-0 md:bottom-[1.75rem]" as const;

/**
 * Control cluster: fixed near the viewport bottom with modest inset; wave strip
 * sits ~0.5rem above this anchor (see WAVE_STRIP_BOTTOM_CLASS).
 */
export const CONTROL_STRIP_DOCK_CLASS =
  "bottom-4 left-0 right-0 md:bottom-5" as const;

/**
 * Fixed column above the wave strip: vertically centers The Artifact so the gap from the
 * viewport top to the block matches the gap from the block to the wave (same inset values
 * as WAVE_STRIP_BOTTOM_CLASS + {@link WAVE_CONFIG.height}).
 *
 * Note: 148px in class strings must stay equal to WAVE_CONFIG.height (Tailwind static scan).
 */
export const ARTIFACT_ZONE_WRAPPER_CLASS =
  "pointer-events-none fixed inset-x-0 top-0 z-[var(--z-atmosphere)] flex items-center justify-center bottom-[calc(1.5rem+148px)] md:bottom-[calc(1.75rem+148px)]" as const;

/**
 * Vertical center of the artifact column (volume, sidebar) — matches the midpoint of
 * {@link ARTIFACT_ZONE_WRAPPER_CLASS}.
 */
export const ARTIFACT_ZONE_CENTER_Y_CLASS =
  "top-[calc((100svh-1.5rem-148px)/2)] -translate-y-1/2 md:top-[calc((100svh-1.75rem-148px)/2)]" as const;

// Frequency bands — each rendered as its own wave, all layered at the same vertical center.
// binStart/binEnd are fractions of frequencyBinCount (0-1).
export const FREQUENCY_BANDS = [
  {
    name: "sub-bass",
    binStart: 0,
    binEnd: 0.012,       // ~0-250 Hz
    color: "139, 61, 37",        // lunar-deep
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
    color: "196, 92, 50",        // lunar
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
    color: "107, 74, 50",        // teal-glow (ember dust)
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
    color: "112, 98, 86",       // warm umber line (readable on parchment)
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
  particleCount: 42,
  beamAngle: -2.2,
  beamSpread: 0.55,
  particleMinRadius: 0.65,
  particleMaxRadius: 2.35,
  particleMinSpeed: 0.08,
  particleMaxSpeed: 0.32,
  particleMinOpacity: 0.055,
  particleMaxOpacity: 0.3,
  opacityCycleSpeed: 0.0008,
  driftStrength: 0.008,
  /** Extra particle speed along beam when music is loud — barely noticeable. */
  audioBoost: 0.006,
  color: "148, 134, 118",      // dust motes (visible on sunlit wall)
  colorDim: "118, 108, 96",
  gradientColor: "232, 148, 92", // sunset (lunar-bright)
  /** Core beam opacity (rest scales from this). */
  gradientOpacity: 0.092,
  /** Caps the brightest center of the cone gradient. */
  gradientHotspotMax: 0.44,
  /** Multiplier on radial radius so light reaches farther across the viewport. */
  gradientFalloffRadiusFactor: 1.28,
  /** Wide ambient wash — stronger on light parchment so the beam reads clearly. */
  ambientWashOpacity: 0.034,
  /**
   * Compresses raw analyser amplitude before any audio-linked math.
   * sqrt tames peaks so loud sections barely push the effect.
   */
  audioAmplitudeScale: 0.26,
  /** Volumetric cone: extra opacity from audio (very small). */
  audioGradientAmp: 0.0035,
  /** Wide wash: extra from audio. */
  audioWashAmp: 0.0008,
  /** Dust: base opacity lift from audio (very small). */
  audioParticleOpacityAmp: 0.028,
} as const;
