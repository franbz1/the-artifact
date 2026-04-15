export type TrackSource =
  | { kind: "file"; file: File }
  | { kind: "url"; url: string; label: string };

export interface TrackEntry {
  id: string;
  source: TrackSource;
}

/** Whether two entries refer to the same playable source (ignores entry id). */
export function sourcesMatch(a: TrackEntry, b: TrackEntry): boolean {
  if (a.source.kind === "file" && b.source.kind === "file") {
    return a.source.file === b.source.file;
  }
  if (a.source.kind === "url" && b.source.kind === "url") {
    return a.source.url === b.source.url;
  }
  return false;
}

export function trackLabel(entry: TrackEntry): string {
  if (entry.source.kind === "file") return entry.source.file.name;
  return entry.source.label;
}

/**
 * True if `fileName` matches any library entry's display name (file basename or catalog label),
 * case-insensitive — used to block duplicate uploads.
 */
export function libraryHasDisplayNameCollision(
  library: readonly TrackEntry[],
  fileName: string,
): boolean {
  const n = fileName.trim();
  if (!n) return false;
  return library.some((e) => {
    const label = trackLabel(e);
    return label.localeCompare(n, undefined, { sensitivity: "base" }) === 0;
  });
}

/**
 * Stable id for a local `File` in the library. Random UUIDs break after `/api/music`
 * bootstrap or any `setLibrary` merge that recreates rows: drag-and-drop still held
 * the old id while `libraryRef` listed a new one (missing library entry).
 */
export function stableLibraryFileEntryId(file: File): string {
  return `file:${encodeURIComponent(file.name)}:${file.size}:${file.lastModified}`;
}

export function createFileTrackEntry(file: File): TrackEntry {
  return {
    id: stableLibraryFileEntryId(file),
    source: { kind: "file", file },
  };
}

export function createUrlTrackEntry(url: string, label: string): TrackEntry {
  return {
    id: crypto.randomUUID(),
    source: { kind: "url", url, label },
  };
}

/** Stable id for tracks from the internal catalog (e.g. GET /api/music). */
export function createCatalogTrackEntry(url: string, label: string): TrackEntry {
  return {
    id: `catalog:${url}`,
    source: { kind: "url", url, label },
  };
}

/** Same audio source, new id so the same library item can appear twice in the queue. */
export function cloneTrackEntryForQueue(entry: TrackEntry): TrackEntry {
  return {
    id: crypto.randomUUID(),
    source: entry.source,
  };
}
