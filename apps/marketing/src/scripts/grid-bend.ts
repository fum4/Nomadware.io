import { CURSOR_FIELD, GRID_WARP } from '../constants';
import { fieldStrength } from './cursor-field';

// The grid's bend toward the cursor, in one place: the warped grid lines (grid-warp.ts) and the
// section bands' edges that sit on them (band-warp.ts) both go through bendPoint, so they bend
// as one. Pure (no DOM), so it is unit-tested.

/** The gravity well: where it sits (viewport px) and how deep it is (0–1). */
export interface Well {
  x: number;
  y: number;
  depth: number;
}

/**
 * Pull at `distance` from the well as a share of that distance: a point moves toward the cursor
 * by distance × this. The peak (GRID_WARP.maxPullPx) sits at radius/√5, where d·(1−t²)² peaks at
 * 0.286·radius; never ≥ 1, so no point crosses the cursor.
 */
const PULL_SCALE = GRID_WARP.maxPullPx / (0.286 * CURSOR_FIELD.radiusPx);

/** Where (x, y) lands, pulled toward the well. */
export function bendPoint(x: number, y: number, well: Well): [number, number] {
  const dx = well.x - x;
  const dy = well.y - y;
  const pull = PULL_SCALE * fieldStrength(Math.hypot(dx, dy)) * well.depth;
  return [x + dx * pull, y + dy * pull];
}

/** Whether the well can bend anything at all this frame. */
export const wellIsBending = (well: Well): boolean => well.depth > GRID_WARP.restDepth;
