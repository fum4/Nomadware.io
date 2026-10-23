import { BLACK_HOLE } from '../constants';
import { advanceProgress, easeOutCubic, lerp } from './black-hole-math';

/** The hero's black hole, as the dot field (scripts/dot-field.ts) drives and draws it. */
export interface BlackHole {
  /**
   * Advance the lifecycle to `now`: it forms once the pointer has rested `stillForMs` ≥
   * BLACK_HOLE.appearAfterMs (pointer in canvas px; null when it is away) and fades otherwise.
   */
  update(now: number, pointer: { x: number; y: number } | null, stillForMs: number): void;
  /** The stain: a solid black core feathering into a soft dark halo, under the dots. */
  draw(context: CanvasRenderingContext2D): void;
}

/**
 * The black hole that seeps in where the cursor rests (owner's ask, NWARE-82): a small black
 * stain growing over BLACK_HOLE.growMs at the centre of the gathered dots' ring, with empty page
 * between it and them (the ring keeps its radius, DOT_FIELD.gatherCorePx). It fades when the
 * cursor moves on. Drawn only: it doesn't touch the dots' motion.
 */
export function createBlackHole(scale: number): BlackHole {
  const centre = { x: 0, y: 0 };
  let progress = 0;
  let strength = 0;
  let lastUpdate = 0;

  /** Horizon radius in CSS px: grows in with the hole from horizonStartShare of its size. */
  const horizonPx = (): number =>
    BLACK_HOLE.horizonPx * lerp(BLACK_HOLE.horizonStartShare, 1, strength);

  return {
    update(now, pointer, stillForMs) {
      const elapsed = lastUpdate === 0 ? 0 : now - lastUpdate;
      lastUpdate = now;
      const forming = pointer !== null && stillForMs >= BLACK_HOLE.appearAfterMs;
      // Born where the cursor rests; stays there while it fades, whatever the cursor does.
      if (forming && progress === 0) Object.assign(centre, pointer);
      progress = advanceProgress(progress, forming, elapsed, BLACK_HOLE.growMs, BLACK_HOLE.fadeMs);
      strength = easeOutCubic(progress);
    },

    draw(context) {
      if (strength === 0) return;
      const radius = horizonPx() * scale;
      const outer = radius * BLACK_HOLE.haloShare;
      const { x, y } = centre;
      // Solid to coreShare of the horizon, feathered to haloAlpha at its edge, gone by haloShare:
      // no stroke, no colour, so it reads as a stain in the page rather than an object on it.
      const stain = context.createRadialGradient(x, y, 0, x, y, outer);
      stain.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
      stain.addColorStop(BLACK_HOLE.coreShare / BLACK_HOLE.haloShare, `rgba(0, 0, 0, ${strength})`);
      stain.addColorStop(
        1 / BLACK_HOLE.haloShare,
        `rgba(0, 0, 0, ${BLACK_HOLE.haloAlpha * strength})`,
      );
      stain.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = stain;
      context.fillRect(x - outer, y - outer, outer * 2, outer * 2);
    },
  };
}
