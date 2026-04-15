/** Seconds to jump for skip prev / next (no playlist). */
export const CONTROL_STRIP_SKIP_SECONDS = 12;

/** Hold this long on skip buttons before time-seek repeat starts (track skip is a short click). */
export const CONTROL_STRIP_SKIP_HOLD_BEFORE_SEEK_MS = 320;

/** While holding skip after threshold, repeat time seek at this interval. */
export const CONTROL_STRIP_SKIP_HOLD_SEEK_INTERVAL_MS = 220;

/** Max pointer-down duration to count as a track skip click. */
export const CONTROL_STRIP_SKIP_CLICK_MAX_MS = 450;

/** Cancel track skip click if the pointer moved farther than this (px). */
export const CONTROL_STRIP_SKIP_CLICK_MOVE_TOLERANCE_PX = 10;

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
