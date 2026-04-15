/** Prefix for `useDraggable` ids (`lib-${libraryEntryId}`) — used as a fallback if drag data is missing. */
export const LIBRARY_DRAG_ID_PREFIX = "lib-";

/** Drag data `type` for library rows (clone into queue). */
export const DND_TYPE_LIBRARY_TRACK = "library-track";

/** Drag data `type` for queue rows (reorder or remove). */
export const DND_TYPE_QUEUE_TRACK = "queue-track";

/** Droppable id for empty queue / panel body (library → queue). */
export const QUEUE_DROP_ZONE_ID = "queue-drop-zone";

/** Droppable id below the last queue row — append at tail (library → queue, reorder to end). */
export const QUEUE_APPEND_TAIL_ID = "queue-append-tail";
