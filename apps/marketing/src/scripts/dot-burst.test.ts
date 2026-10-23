import { describe, expect, it } from 'vitest';

import { BLACK_HOLE } from '../constants';
import type { FlungBody } from './dot-burst';
import { burst, isFlung } from './dot-burst';

const body = (x: number, y: number): FlungBody => ({
  x,
  y,
  vx: 0,
  vy: 0,
  flungAt: Number.NEGATIVE_INFINITY,
});

describe('burst', () => {
  it('throws near dots straight out, harder the closer they are, and leaves far ones', () => {
    const reach = BLACK_HOLE.burstRadiusPx;
    const near = body(10, 0);
    const mid = body(0, reach / 2);
    const far = body(reach + 1, 0);
    burst([near, mid, far], { x: 0, y: 0 }, 1, 1, 100, () => 0.5);
    expect(near.vx).toBeGreaterThan(0);
    expect(near.vy).toBeCloseTo(0);
    expect(mid.vy).toBeGreaterThan(0);
    expect(near.vx).toBeGreaterThan(mid.vy);
    expect(far.vx).toBe(0);
    expect(isFlung(near, 100)).toBe(true);
    expect(isFlung(far, 100)).toBe(false);
    expect(isFlung(near, 100 + BLACK_HOLE.burstFreeMs)).toBe(false);
  });

  it("scales with the hole's strength", () => {
    const weak = body(10, 0);
    const strong = body(10, 0);
    burst([weak], { x: 0, y: 0 }, 0.5, 1, 0, () => 0.5);
    burst([strong], { x: 0, y: 0 }, 1, 1, 0, () => 0.5);
    expect(strong.vx).toBeCloseTo(weak.vx * 2);
  });
});
