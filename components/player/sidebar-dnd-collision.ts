import type { CollisionDetection } from "@dnd-kit/core";
import { closestCenter, pointerWithin } from "@dnd-kit/core";
import type { RefObject } from "react";
import {
  DND_TYPE_LIBRARY_TRACK,
  DND_TYPE_QUEUE_TRACK,
} from "@/components/player/playback-dnd.constants";

function pointInRect(
  x: number,
  y: number,
  r: DOMRect | DOMRectReadOnly,
): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/**
 * `closestCenter` alone keeps matching the nearest queue row even when the pointer is
 * far away (e.g. corner of the viewport), so reorder always wins over remove.
 *
 * For queue-row drags we:
 * - Return no collisions when the pointer leaves the sidebar stack → remove on drop.
 * - Return no collisions over the library column → remove (drag back to library).
 * - Prefer `pointerWithin` so only the row under the cursor is targeted.
 * - Fall back to `closestCenter` for thin gaps between rows.
 *
 * For library-row drags we:
 * - Return no collisions when the pointer leaves the sidebar stack → drop outside (remove from library flow).
 * - Inside the stack, prefer `pointerWithin` then `closestCenter` (same as queue), so a far-away drop
 *   does not snap to the queue as if it were a move.
 */
export function createSidebarCollisionDetection(options: {
  sidebarStackRef: RefObject<HTMLElement | null>;
  libraryPanelRef: RefObject<HTMLElement | null>;
}): CollisionDetection {
  return (args) => {
    const { active, pointerCoordinates } = args;

    if (active.data.current?.type === DND_TYPE_LIBRARY_TRACK) {
      if (!pointerCoordinates) {
        return closestCenter(args);
      }
      const { x, y } = pointerCoordinates;
      const stack = options.sidebarStackRef.current;
      if (stack) {
        const sb = stack.getBoundingClientRect();
        if (!pointInRect(x, y, sb)) {
          return [];
        }
      }
      const pointerHits = pointerWithin(args);
      if (pointerHits.length > 0) {
        return pointerHits;
      }
      return closestCenter(args);
    }

    if (active.data.current?.type !== DND_TYPE_QUEUE_TRACK) {
      return closestCenter(args);
    }

    if (!pointerCoordinates) {
      return closestCenter(args);
    }

    const { x, y } = pointerCoordinates;

    const stack = options.sidebarStackRef.current;
    if (stack) {
      const sb = stack.getBoundingClientRect();
      if (!pointInRect(x, y, sb)) {
        return [];
      }
    }

    const libraryEl = options.libraryPanelRef.current;
    if (libraryEl) {
      const lr = libraryEl.getBoundingClientRect();
      if (pointInRect(x, y, lr)) {
        return [];
      }
    }

    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      return pointerHits;
    }

    return closestCenter(args);
  };
}
