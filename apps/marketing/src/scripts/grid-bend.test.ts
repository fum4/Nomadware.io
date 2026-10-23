import { describe, expect, it } from 'vitest';

import { CURSOR_FIELD, GRID_WARP } from '../constants';
import { bendPoint } from './grid-bend';

const WELL = { x: 500, y: 300, depth: 1 };

describe('bendPoint', () => {
  it('leaves points outside the field, or with no depth, where they are', () => {
    expect(bendPoint(500 + CURSOR_FIELD.radiusPx + 1, 300, WELL)).toEqual([
      500 + CURSOR_FIELD.radiusPx + 1,
      300,
    ]);
    expect(bendPoint(450, 300, { ...WELL, depth: 0 })).toEqual([450, 300]);
  });

  // At most maxPullPx, to the rounding of PULL_SCALE's 0.286 (a few ten-thousandths of a px).
  it('pulls a point toward the well, at most maxPullPx, never past it', () => {
    for (let distance = 1; distance < CURSOR_FIELD.radiusPx; distance += 1) {
      const [x] = bendPoint(500 - distance, 300, WELL);
      const moved = x - (500 - distance);
      expect(moved).toBeGreaterThanOrEqual(0);
      expect(moved).toBeLessThanOrEqual(GRID_WARP.maxPullPx + 0.01);
      expect(x).toBeLessThan(500);
    }
  });
});
