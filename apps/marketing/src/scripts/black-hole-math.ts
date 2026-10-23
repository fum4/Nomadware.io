// The black hole's pure math (scripts/black-hole.ts): its lifecycle and easing. No DOM, so it is unit-tested.

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/**
 * The hole's lifecycle progress (0 = gone, 1 = full) after `elapsedMs`: toward 1 over `growMs`
 * while `forming`, back toward 0 over `fadeMs` otherwise. Linear; the look eases it.
 */
export function advanceProgress(
  progress: number,
  forming: boolean,
  elapsedMs: number,
  growMs: number,
  fadeMs: number,
): number {
  const next = forming ? progress + elapsedMs / growMs : progress - elapsedMs / fadeMs;
  return Math.min(1, Math.max(0, next));
}

/** `from` → `to` by `t` (0–1). */
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
