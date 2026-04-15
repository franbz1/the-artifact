import { SECONDARY_PANEL_TRIGGER_GUTTER_REM } from "@/components/player/secondary-panel.constants";

/** Same horizontal alignment as library — stacked panels share one column. */
export const QUEUE_PANEL_RIGHT_OFFSET_REM =
  SECONDARY_PANEL_TRIGGER_GUTTER_REM + 3.25;

/**
 * Max height of the whole queue panel (header + body), in rem — matches library column scale.
 */
export const QUEUE_FLOATING_PANEL_MAX_HEIGHT_REM = 6;

/** Minimum height of queue body when empty (drop target). Fits under header within max panel height. */
export const QUEUE_FLOATING_PANEL_MIN_BODY_REM = 3;

/** Panel width: min(rem, vw) — keep in sync with library. */
export const QUEUE_FLOATING_PANEL_WIDTH_CLASS =
  "min-w-0 w-[min(18rem,40vw)] max-w-[min(18rem,40vw)]";

/** Subtle horizontal drift for entrance (px). */
export const QUEUE_PANEL_MOTION_OFFSET_PX = 10;

/** Same layer as library panel. */
export const QUEUE_FLOATING_PANEL_Z = 41;
