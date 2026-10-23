// Easing curves shared by the client scripts (t: 0 → 1).

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** Barely moving at both ends, all the travel in a rush through the middle. */
export const easeInOutExpo = (t: number): number => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};

/** A near-instant start that lands very softly. */
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
