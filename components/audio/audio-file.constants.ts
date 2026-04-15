export const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;
export const ACCEPTED_INPUT = ".mp3,.wav,.ogg,.flac,.m4a,.aac,.webm";

/** MIME types we accept when the browser reports them (must still match extension). */
export const ACCEPTED_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/x-aac",
  "audio/webm",
]);

/**
 * Allowed uploads: basename must match our extensions; if `type` is present it must be
 * compatible (unknown / octet-stream allowed — browsers often omit or mislabel MIME).
 */
export function isAudioFile(file: File): boolean {
  if (!ACCEPTED_EXTENSIONS.test(file.name)) {
    return false;
  }
  const t = file.type;
  if (!t || t === "application/octet-stream") {
    return true;
  }
  if (ACCEPTED_TYPES.has(t)) {
    return true;
  }
  // Browsers often label audio-only .webm as video/webm
  if (/\.webm$/i.test(file.name) && t === "video/webm") {
    return true;
  }
  return false;
}

/** Basename check for server-side directory scans (e.g. `public/music`). */
export function isAudioBasename(filename: string): boolean {
  return ACCEPTED_EXTENSIONS.test(filename);
}
