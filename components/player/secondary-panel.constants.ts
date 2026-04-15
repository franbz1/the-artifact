/** Width of the invisible hover gutter from the right safe edge (rem). */
export const SECONDARY_PANEL_TRIGGER_GUTTER_REM = 3.5;

/**
 * Vertical hover band height (viewport height %), clamped in CSS.
 * Kept near viewport center so the control reads as “mid-screen on Y”.
 */
export const SECONDARY_PANEL_TRIGGER_ZONE_VH = 32;

/** Open panel width: min(this rem, this vw). */
export const SECONDARY_PANEL_OPEN_MIN_REM = 22;
export const SECONDARY_PANEL_OPEN_MAX_VW = 40;

/** Blur on inner shell while panel is opening / when nearly closed (dissolve). */
export const SECONDARY_PANEL_BLUR_PX = 8;

/** Region id for aria-controls. */
export const SECONDARY_PANEL_REGION_ID = "secondary-panel-region";
