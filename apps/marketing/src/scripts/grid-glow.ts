import { CURSOR_FIELD, GRID_WARP } from '../constants';
import { fieldStrength } from './cursor-field';

// The bent grid lines' glow (scripts/grid-warp.ts): brighter where the cursor pulls hardest.

export type Rgba = [number, number, number, number];

/** The field's falloff (fieldStrength) sampled at these radius shares, for the glow's stops. */
const GLOW_STOPS = [0.25, 0.5, 0.75, 1];

/** Any CSS colour as [r, g, b, a], normalised by the canvas itself. */
export function parseColor(context: CanvasRenderingContext2D, css: string): Rgba {
  context.fillStyle = '#000';
  context.fillStyle = css.trim();
  const value = String(context.fillStyle);
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
  if (hex) return [...hex.slice(1, 4).map((part) => Number.parseInt(part, 16)), 1] as Rgba;
  const parts = /rgba?\(([^)]+)\)/.exec(value)?.[1]?.split(',').map(Number) ?? [];
  const [red = 0, green = 0, blue = 0, alpha = 1] = parts;
  return [red, green, blue, alpha];
}

const rgba = ([red, green, blue, alpha]: Rgba, scale: number): string =>
  `rgba(${red}, ${green}, ${blue}, ${alpha * scale})`;

/**
 * Brightness added to the bent lines: --grid-glow-core at the cursor, --grid-glow beyond it,
 * fading with the field's own curve and with the well's depth.
 */
export function glowGradient(
  context: CanvasRenderingContext2D,
  well: { x: number; y: number; depth: number },
  core: Rgba,
  glow: Rgba,
): CanvasGradient {
  const radius = CURSOR_FIELD.radiusPx;
  const gradient = context.createRadialGradient(well.x, well.y, 0, well.x, well.y, radius);
  gradient.addColorStop(0, rgba(core, well.depth));
  gradient.addColorStop(
    GRID_WARP.glowCoreShare,
    rgba(glow, fieldStrength(radius * GRID_WARP.glowCoreShare) * well.depth),
  );
  GLOW_STOPS.forEach((share) =>
    gradient.addColorStop(share, rgba(glow, fieldStrength(radius * share) * well.depth)),
  );
  return gradient;
}
