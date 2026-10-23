// Easing curves shared by the client scripts (t: 0 → 1).

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
