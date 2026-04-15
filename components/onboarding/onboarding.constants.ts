export const ARTIFACT_ONBOARD_COOKIE = "artifact_onboarded";
export const ARTIFACT_ONBOARD_COOKIE_VALUE = "1";
/** One year */
export const ARTIFACT_ONBOARD_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function writeArtifactOnboardCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ARTIFACT_ONBOARD_COOKIE}=${ARTIFACT_ONBOARD_COOKIE_VALUE}; path=/; max-age=${ARTIFACT_ONBOARD_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

export function readArtifactOnboardCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) return false;
    const k = trimmed.slice(0, eq);
    const v = trimmed.slice(eq + 1);
    return k === ARTIFACT_ONBOARD_COOKIE && v === ARTIFACT_ONBOARD_COOKIE_VALUE;
  });
}

/** Viewports at or below this width are treated as mobile (desktop-only experience). */
export const MOBILE_MAX_WIDTH_PX = 768;
