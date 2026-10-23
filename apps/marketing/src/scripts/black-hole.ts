import { BLACK_HOLE, DOT_FIELD } from '../constants';
import {
  advanceProgress,
  blendDilation,
  easeOutCubic,
  mixRgba,
  quantise,
  timeDilation,
} from './black-hole-math';
import type { Rgba } from './grid-glow';
import { parseColor } from './grid-glow';

const FULL_TURN = Math.PI * 2;

const css = ([red, green, blue, alpha]: Rgba): string =>
  `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${alpha.toFixed(3)})`;

/** The hero's black hole, as the dot field (scripts/dot-field.ts) drives and draws it. */
export interface BlackHole {
  /**
   * Advance the lifecycle to `now`: it forms once the pointer has rested `stillForMs` ≥
   * BLACK_HOLE.appearAfterMs (pointer in canvas px; null when it is away) and fades otherwise.
   */
  update(now: number, pointer: { x: number; y: number } | null, stillForMs: number): void;
  /** How much a body at (x, y) still moves, as an observer far away sees it: 1 = freely, 0 = frozen. */
  dilationAt(x: number, y: number): number;
  /** A dot's colour, redshifted and dimmed as its dilation falls. */
  dotColor(highlight: boolean, dilation: number): string;
  /** The halo, the horizon and the photon ring, under the dots. */
  draw(context: CanvasRenderingContext2D): void;
}

/**
 * The black hole that forms where the cursor rests (owner's ask, NWARE-82): it grows in, the dots
 * falling toward it slow and redden as they near its horizon and freeze there, and it fades when
 * the cursor moves on. Its horizon is the gathered dots' ring (DOT_FIELD.gatherCorePx ×
 * BLACK_HOLE.horizonShare), so with or without it they gather at the same radius.
 */
export function createBlackHole(context: CanvasRenderingContext2D, scale: number): BlackHole {
  const centre = { x: 0, y: 0 };
  const fullHorizon = DOT_FIELD.gatherCorePx * BLACK_HOLE.horizonShare * scale;
  let progress = 0;
  let strength = 0;
  let lastUpdate = 0;

  // Each dot's colour comes from a few cached steps between its own and the redshifted one.
  const base = parseColor(context, DOT_FIELD.color);
  const highlight = parseColor(context, DOT_FIELD.highlightColor);
  const redshift = parseColor(context, BLACK_HOLE.redshiftColor);
  const levels = BLACK_HOLE.redshiftLevels;
  const palette = [base, highlight].map((from) =>
    Array.from({ length: levels + 1 }, (_, level) => css(mixRgba(from, redshift, level / levels))),
  );

  // The horizon grows in with the hole, from horizonStartShare of its size.
  const horizon = (): number =>
    fullHorizon * (BLACK_HOLE.horizonStartShare + (1 - BLACK_HOLE.horizonStartShare) * strength);

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

    dilationAt(x, y) {
      if (strength === 0) return 1;
      return blendDilation(
        timeDilation(Math.hypot(x - centre.x, y - centre.y), horizon()),
        strength,
      );
    },

    dotColor(isHighlight, dilation) {
      const shades = palette[isHighlight ? 1 : 0] ?? [];
      return shades[quantise(1 - dilation, levels)] ?? css(isHighlight ? highlight : base);
    },

    draw(target) {
      if (strength === 0) return;
      const radius = horizon();
      const { x, y } = centre;
      // The dark falloff round it: space looks emptier near the hole.
      const halo = target.createRadialGradient(x, y, radius, x, y, radius * BLACK_HOLE.haloShare);
      halo.addColorStop(0, `rgba(0, 0, 0, ${BLACK_HOLE.haloAlpha * strength})`);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      target.fillStyle = halo;
      target.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);
      // The horizon: pure black, darker than the page, covering the grid behind it.
      target.globalAlpha = strength;
      target.fillStyle = '#000';
      target.beginPath();
      target.arc(x, y, radius, 0, FULL_TURN);
      target.fill();
      // The photon ring just outside it: thin, faint, softly glowing.
      target.strokeStyle = BLACK_HOLE.photonRingColor;
      target.lineWidth = BLACK_HOLE.photonRingWidthPx * scale;
      target.shadowColor = BLACK_HOLE.photonGlowColor;
      target.shadowBlur = BLACK_HOLE.photonGlowPx * scale;
      target.beginPath();
      target.arc(x, y, radius * BLACK_HOLE.photonRingShare, 0, FULL_TURN);
      target.stroke();
      target.shadowBlur = 0;
      target.globalAlpha = 1;
    },
  };
}
