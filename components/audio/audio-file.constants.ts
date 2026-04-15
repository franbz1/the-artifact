export const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;
export const ACCEPTED_INPUT = ".mp3,.wav,.ogg,.flac,.m4a,.aac,.webm";

export const ACCEPTED_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
]);

export function isAudioFile(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name);
}
