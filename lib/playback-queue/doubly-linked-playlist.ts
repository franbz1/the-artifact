import type { TrackEntry } from "./types";
import { sourcesMatch, trackLabel } from "./types";

export class TrackNode {
  readonly entry: TrackEntry;
  prev: TrackNode | null = null;
  next: TrackNode | null = null;

  constructor(entry: TrackEntry) {
    this.entry = entry;
  }
}

/**
 * Doubly linked list of tracks with a playback cursor (`current`).
 */
export class DoublyLinkedPlaylist {
  head: TrackNode | null = null;
  tail: TrackNode | null = null;
  /** Node currently selected for playback (may be null when empty). */
  current: TrackNode | null = null;

  isEmpty(): boolean {
    return this.head === null;
  }

  private unlinkNode(node: TrackNode): void {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }

  private linkBefore(node: TrackNode, before: TrackNode): void {
    node.next = before;
    node.prev = before.prev;
    if (before.prev) before.prev.next = node;
    else this.head = node;
    before.prev = node;
  }

  private linkAfter(node: TrackNode, after: TrackNode): void {
    node.prev = after;
    node.next = after.next;
    if (after.next) after.next.prev = node;
    else this.tail = node;
    after.next = node;
  }

  private appendNode(node: TrackNode): void {
    if (!this.tail) {
      this.head = this.tail = node;
      return;
    }
    this.linkAfter(node, this.tail);
  }

  /** Inserts at tail. Sets `current` when the list was empty. */
  appendEntry(entry: TrackEntry): TrackNode {
    const node = new TrackNode(entry);
    const wasEmpty = this.isEmpty();
    this.appendNode(node);
    if (wasEmpty) {
      this.current = node;
    }
    return node;
  }

  /** Moves cursor to next node if it exists. */
  advanceCurrent(): boolean {
    if (!this.current?.next) return false;
    this.current = this.current.next;
    return true;
  }

  /** Moves cursor to previous node if it exists. */
  retreatCurrent(): boolean {
    if (!this.current?.prev) return false;
    this.current = this.current.prev;
    return true;
  }

  findNodeById(id: string): TrackNode | null {
    let n: TrackNode | null = this.head;
    while (n) {
      if (n.entry.id === id) return n;
      n = n.next;
    }
    return null;
  }

  /**
   * Selects the first queue node whose source matches `entry`, updates `current`,
   * and returns that node; returns null if no match.
   */
  selectBySourceMatch(entry: TrackEntry): TrackNode | null {
    let n: TrackNode | null = this.head;
    while (n) {
      if (sourcesMatch(n.entry, entry)) {
        this.current = n;
        return n;
      }
      n = n.next;
    }
    return null;
  }

  /**
   * Removes a node by id. Repairs `current` if it was removed
   * (prefers next neighbor, else previous, else null).
   */
  removeById(id: string): boolean {
    const node = this.findNodeById(id);
    if (!node) return false;

    const wasCurrent = this.current === node;
    let nextCurrent: TrackNode | null = null;
    if (wasCurrent) {
      nextCurrent = node.next ?? node.prev ?? null;
    }

    this.unlinkNode(node);

    if (wasCurrent) {
      this.current = nextCurrent;
    }

    return true;
  }

  /**
   * Detaches `source` and inserts it immediately before `before`.
   * If `source` is `current`, `current` remains on that node (same entry).
   */
  moveBefore(sourceId: string, beforeId: string): boolean {
    const source = this.findNodeById(sourceId);
    const before = this.findNodeById(beforeId);
    if (!source || !before || source === before) return false;

    this.unlinkNode(source);
    this.linkBefore(source, before);
    return true;
  }

  /**
   * Detaches `source` and inserts it immediately after `after`.
   */
  moveAfter(sourceId: string, afterId: string): boolean {
    const source = this.findNodeById(sourceId);
    const after = this.findNodeById(afterId);
    if (!source || !after || source === after) return false;

    this.unlinkNode(source);
    this.linkAfter(source, after);
    return true;
  }

  /** Ordered entries from head to tail (UI list / queue panel). */
  toOrderedEntries(): TrackEntry[] {
    const out: TrackEntry[] = [];
    let n: TrackNode | null = this.head;
    while (n) {
      out.push(n.entry);
      n = n.next;
    }
    return out;
  }

  /** Current track and all following entries (queue panel: now playing + upcoming). */
  toOrderedEntriesFromCurrent(): TrackEntry[] {
    const out: TrackEntry[] = [];
    let n: TrackNode | null = this.current;
    while (n) {
      out.push(n.entry);
      n = n.next;
    }
    return out;
  }

  /** Removes all nodes and clears the playback cursor. */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.current = null;
  }

  /** Ordered entries from head to tail (for logging). */
  toOrderedLabels(): string[] {
    const out: string[] = [];
    let n: TrackNode | null = this.head;
    while (n) {
      out.push(trackLabel(n.entry));
      n = n.next;
    }
    return out;
  }

  /** Sets playback cursor to the node with this queue entry id, if it exists. */
  selectCurrentById(id: string): boolean {
    const node = this.findNodeById(id);
    if (!node) return false;
    this.current = node;
    return true;
  }

  currentLabel(): string | null {
    return this.current ? trackLabel(this.current.entry) : null;
  }

  currentId(): string | null {
    return this.current?.entry.id ?? null;
  }
}
