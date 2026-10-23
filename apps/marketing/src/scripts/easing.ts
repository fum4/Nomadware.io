// Easing curves shared by the client scripts (t: 0 → 1).

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** A very slow start, fastest midway, a soft landing. */
export const easeInOutQuint = (t: number): number =>
  t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;

/** A near-instant start that lands very softly. */
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
