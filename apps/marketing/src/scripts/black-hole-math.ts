// The black hole's pure math (scripts/black-hole.ts): its lifecycle and easing. No DOM, so it is unit-tested.

/** Fast start, gentle landing. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/**
 * The size (0 = gone, 1 = full) the hole heads for at a cursor `speed` (CSS px/s): full while
 * calm, shrinking linearly as the cursor speeds up, gone at `collapseSpeed` and beyond.
 */
export function targetSize(speed: number, calmSpeed: number, collapseSpeed: number): number {
  return Math.min(1, Math.max(0, 1 - (speed - calmSpeed) / (collapseSpeed - calmSpeed)));
}

/**
 * The hole's progress after `elapsedMs`, moved toward `target`: up at 1 per `growMs`, down at
 * 1 per `shrinkMs`, never past the target. Linear; the look eases it.
 */
export function advanceToward(
  progress: number,
  target: number,
  elapsedMs: number,
  growMs: number,
  shrinkMs: number,
): number {
  if (progress < target) return Math.min(target, progress + elapsedMs / growMs);
  return Math.max(target, progress - elapsedMs / shrinkMs);
}

/** How far toward a moving target an exponential follow gets in `elapsedMs` (time constant `ms`). */
export const followShare = (elapsedMs: number, ms: number): number => 1 - Math.exp(-elapsedMs / ms);

/** `from` → `to` by `t` (0–1). */
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
