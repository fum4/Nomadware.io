import { BLACK_HOLE } from '../constants';
import type { Body } from './dot-separation';

// The black hole's collapse (scripts/black-hole.ts) flinging the dots near it outward
// (scripts/dot-field.ts). Pure: no DOM, so it is unit-tested.

export interface FlungBody extends Body {
  /** When a burst last threw it (performance.now()), -Infinity if never. */
  flungAt: number;
}

/**
 * Throw every dot within BLACK_HOLE.burstRadiusPx of `centre` (canvas px) straight away from it,
 * hardest at the centre and fading to nothing at the radius, scaled by the hole's `strength` and a
 * little randomness per dot, so it reads as a blast, not a ripple. `random` is injectable for tests.
 */
export function burst(
  bodies: readonly FlungBody[],
  centre: { x: number; y: number },
  strength: number,
  scale: number,
  now: number,
  random: () => number = Math.random,
): void {
  const reach = BLACK_HOLE.burstRadiusPx * scale;
  for (const body of bodies) {
    const dx = body.x - centre.x;
    const dy = body.y - centre.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= reach) continue;
    // A dot dead centre has no direction of its own: give it a random one.
    const angle = distance > 0 ? Math.atan2(dy, dx) : random() * 2 * Math.PI;
    const kick =
      BLACK_HOLE.burstSpeed *
      strength *
      (1 - distance / reach) *
      (1 - BLACK_HOLE.burstSpread + 2 * BLACK_HOLE.burstSpread * random());
    body.vx += Math.cos(angle) * kick;
    body.vy += Math.sin(angle) * kick;
    body.flungAt = now;
  }
}

/** Still flying from a burst: no cursor pull, no speed limit, plain friction. */
export const isFlung = (body: FlungBody, now: number): boolean =>
  now - body.flungAt < BLACK_HOLE.burstFreeMs;
