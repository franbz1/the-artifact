import { SECONDARY_PANEL_TRIGGER_GUTTER_REM } from "@/components/player/secondary-panel.constants";

/** Horizontal offset from viewport right (rem): trigger gutter + glyph clearance. */
export const LIBRARY_PANEL_RIGHT_OFFSET_REM =
  SECONDARY_PANEL_TRIGGER_GUTTER_REM + 3.25;

/**
 * Max height of the whole panel (header + list), in rem.
 * Tuned for ~3–4 visible track rows before internal scroll.
 */
export const LIBRARY_FLOATING_PANEL_MAX_HEIGHT_REM = 6;

/** Panel width: min(rem, vw). */
export const LIBRARY_FLOATING_PANEL_MIN_REM = 18;
export const LIBRARY_FLOATING_PANEL_MAX_VW = 40;

/**
 * Tailwind width classes — numeric literals must stay in sync with MIN_REM / MAX_VW
 * so Tailwind can scan them at build time.
 */
export const LIBRARY_FLOATING_PANEL_WIDTH_CLASS =
  "min-w-0 w-[min(18rem,40vw)] max-w-[min(18rem,40vw)]";

/** Subtle horizontal drift for entrance (px); disabled when reduced motion. */
export const LIBRARY_PANEL_MOTION_OFFSET_PX = 10;

/** Stacked above main canvas chrome, below control strip (z-50). */
export const LIBRARY_FLOATING_PANEL_Z = 41;
