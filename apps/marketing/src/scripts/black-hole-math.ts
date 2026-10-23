import type { Rgba } from './grid-glow';

// The black hole's pure math (scripts/black-hole.ts): its lifecycle easing and what a distant
// observer sees of matter falling toward it. No DOM, so it is unit-tested.

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

/**
 * Gravitational time dilation as a distant observer sees it, √(1 − r_s / r): 1 far away, 0 at
 * the horizon (r_s) and inside it. Scaling a dot's motion by it makes infalling matter slow
 * down and freeze at the horizon, never seen to cross.
 */
export function timeDilation(distance: number, horizon: number): number {
  return distance <= horizon ? 0 : Math.sqrt(1 - horizon / distance);
}

/** What `strength` (0–1) of the hole leaves of a dilation: none at 0, all of it at 1. */
export const blendDilation = (dilation: number, strength: number): number =>
  1 - strength * (1 - dilation);

/** `from` → `to` by `t` (0–1), each channel linearly. */
export function mixRgba(from: Rgba, to: Rgba, t: number): Rgba {
  const mix = (a: number, b: number): number => a + (b - a) * t;
  return [mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2]), mix(from[3], to[3])];
}

/** Quantise a 0–1 amount to `levels` steps, so a few cached colours serve every dot. */
export const quantise = (amount: number, levels: number): number =>
  Math.round(Math.min(1, Math.max(0, amount)) * levels);
