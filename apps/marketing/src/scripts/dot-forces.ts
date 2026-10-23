import { DOT_FIELD } from '../constants';
import { fieldStrength } from './cursor-field';

// The hero dots' forces (scripts/dot-field.ts), pure, so they are unit-tested.

/**
 * How far into its diffusion a released dot is, 0 → 1 → 0: rises over releaseRampMs (so the clump
 * loosens gradually, never bursts), then falls back to 0 by releaseMs (DOT_FIELD).
 */
export function releaseEnvelope(ageMs: number): number {
  const { releaseRampMs, releaseMs } = DOT_FIELD;
  if (ageMs <= 0 || ageMs >= releaseMs) return 0;
  return ageMs < releaseRampMs
    ? ageMs / releaseRampMs
    : 1 - (ageMs - releaseRampMs) / (releaseMs - releaseRampMs);
}

/**
 * Negative pulls toward the cursor; inside the core it pushes out, so the cursor stays clear.
 * The pull is gravity's inverse square (softened, so it stays finite), faded to 0 at the field's
 * edge: a dot drifts in slowly from afar and falls in ever faster.
 */
export function cursorPull(distance: number): number {
  const { gatherCorePx, gatherCorePush, gravity, gravitySofteningPx } = DOT_FIELD;
  if (distance < gatherCorePx) return gatherCorePush * (1 - distance / gatherCorePx);
  return (-gravity / (distance ** 2 + gravitySofteningPx ** 2)) * fieldStrength(distance);
}
