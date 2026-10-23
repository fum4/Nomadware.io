import { describe, expect, it } from 'vitest';

import { easeInOutExpo, easeOutCubic, easeOutExpo } from './easing';

describe('easeOutCubic', () => {
  it('runs 0 → 1, most of the way early', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});

describe('easeInOutExpo', () => {
  it('crawls at both ends, half way at the midpoint', () => {
    expect(easeInOutExpo(0)).toBe(0);
    expect(easeInOutExpo(0.5)).toBe(0.5);
    expect(easeInOutExpo(1)).toBe(1);
    expect(easeInOutExpo(0.2)).toBeLessThan(0.01);
    expect(easeInOutExpo(0.8)).toBeGreaterThan(0.99);
  });
});

describe('easeOutExpo', () => {
  it('runs 0 → 1 and lands exactly', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(0.5)).toBeCloseTo(1 - 2 ** -5);
  });
});
