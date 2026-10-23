import { describe, expect, it } from 'vitest';

import {
  advanceProgress,
  blendDilation,
  easeOutCubic,
  mixRgba,
  quantise,
  timeDilation,
} from './black-hole-math';

describe('advanceProgress', () => {
  it('grows over growMs and fades over fadeMs, clamped to 0–1', () => {
    expect(advanceProgress(0, true, 500, 2000, 500)).toBe(0.25);
    expect(advanceProgress(0.9, true, 500, 2000, 500)).toBe(1);
    expect(advanceProgress(1, false, 250, 2000, 500)).toBe(0.5);
    expect(advanceProgress(0.1, false, 250, 2000, 500)).toBe(0);
  });
});

describe('easeOutCubic', () => {
  it('runs 0 → 1, most of the way early', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});

describe('timeDilation', () => {
  it('is 0 at and inside the horizon, approaches 1 far away', () => {
    expect(timeDilation(40, 40)).toBe(0);
    expect(timeDilation(10, 40)).toBe(0);
    expect(timeDilation(160, 40)).toBeCloseTo(Math.sqrt(0.75));
    expect(timeDilation(40_000, 40)).toBeGreaterThan(0.999);
  });

  it('slows matter ever more as it nears the horizon', () => {
    const radii = [200, 100, 60, 45, 41];
    const factors = radii.map((radius) => timeDilation(radius, 40));
    expect(factors).toEqual(factors.toSorted((a, b) => b - a));
  });
});

describe('blendDilation', () => {
  it('has no effect without the hole and the full effect with it', () => {
    expect(blendDilation(0.2, 0)).toBe(1);
    expect(blendDilation(0.2, 1)).toBeCloseTo(0.2);
    expect(blendDilation(0, 0.5)).toBe(0.5);
  });
});

describe('mixRgba and quantise', () => {
  it('mixes each channel', () => {
    expect(mixRgba([0, 100, 200, 1], [100, 100, 0, 0], 0.25)).toEqual([25, 100, 150, 0.75]);
  });

  it('quantises a clamped amount', () => {
    expect(quantise(0.49, 8)).toBe(4);
    expect(quantise(1.5, 8)).toBe(8);
    expect(quantise(-1, 8)).toBe(0);
  });
});
