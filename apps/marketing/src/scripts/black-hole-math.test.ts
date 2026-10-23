import { describe, expect, it } from 'vitest';

import { advanceToward, easeOutCubic, followShare, lerp, targetSize } from './black-hole-math';

describe('targetSize', () => {
  it('is full while calm, shrinks with speed, gone at the collapse speed', () => {
    expect(targetSize(0, 40, 840)).toBe(1);
    expect(targetSize(40, 40, 840)).toBe(1);
    expect(targetSize(440, 40, 840)).toBe(0.5);
    expect(targetSize(840, 40, 840)).toBe(0);
    expect(targetSize(5000, 40, 840)).toBe(0);
  });
});

describe('advanceToward', () => {
  it('grows over growMs and shrinks over shrinkMs, stopping at the target', () => {
    expect(advanceToward(0, 1, 500, 2000, 500)).toBe(0.25);
    expect(advanceToward(0.9, 1, 500, 2000, 500)).toBe(1);
    expect(advanceToward(1, 0, 250, 2000, 500)).toBe(0.5);
    expect(advanceToward(1, 0.7, 250, 2000, 500)).toBe(0.7);
    expect(advanceToward(0.6, 0.7, 2000, 2000, 500)).toBe(0.7);
  });
});

describe('followShare', () => {
  it('is 0 with no time, approaches 1 with long time', () => {
    expect(followShare(0, 100)).toBe(0);
    expect(followShare(100, 100)).toBeCloseTo(1 - Math.exp(-1));
    expect(followShare(10_000, 100)).toBeCloseTo(1);
  });
});

describe('easeOutCubic', () => {
  it('runs 0 → 1, most of the way early', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});

describe('lerp', () => {
  it('runs from → to', () => {
    expect(lerp(44, 20, 0)).toBe(44);
    expect(lerp(44, 20, 0.5)).toBe(32);
    expect(lerp(44, 20, 1)).toBe(20);
  });
});
