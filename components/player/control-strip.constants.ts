/** Seconds to jump for skip prev / next (no playlist). */
export const CONTROL_STRIP_SKIP_SECONDS = 12;

/** Long-press duration before secondary transport (shuffle/repeat mocks). */
export const CONTROL_STRIP_LONG_PRESS_MS = 700;

/** Cancel long-press if pointer moves beyond this distance (px). */
export const CONTROL_STRIP_LONG_PRESS_MOVE_PX = 12;

/** Vertical volume slider slot height (px); matches rotated range length. */
export const CONTROL_STRIP_VOLUME_TRACK_HEIGHT_PX = 56;

/** Fixed left-edge volume dock: visual track length (horizontal width before -90° rotation). */
export const FIXED_VOLUME_TRACK_HEIGHT_PX = 400;

/** Pointer X ratio vs value (0–1) within this distance counts as “near thumb”. */
export const CONTROL_STRIP_VOLUME_THUMB_PROXIMITY = 0.14;

/** Fixed width of the control strip shell (not full viewport). */
export const CONTROL_STRIP_SHELL_WIDTH_REM = 12;

/** Default max width (rem) for TrackTitleTrim when no override is passed. */
export const CONTROL_STRIP_TITLE_SLOT_MAX_REM = 5.25;

/** Max width (rem) for the fixed top-left track title; crawl when text overflows. */
export const TRACK_TITLE_CORNER_MAX_REM = 36;
