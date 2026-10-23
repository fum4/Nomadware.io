// Easing curves shared by the client scripts (t: 0 → 1).

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** A near-instant start that lands very softly. */
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
