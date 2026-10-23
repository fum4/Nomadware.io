import { describe, expect, it } from 'vitest';

import { easeInOutQuint, easeOutCubic, easeOutExpo } from './easing';

describe('easeOutCubic', () => {
  it('runs 0 → 1, most of the way early', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});

describe('easeInOutQuint', () => {
  it('crawls at both ends, half way at the midpoint', () => {
    expect(easeInOutQuint(0)).toBe(0);
    expect(easeInOutQuint(0.5)).toBe(0.5);
    expect(easeInOutQuint(1)).toBe(1);
    expect(easeInOutQuint(0.1)).toBeLessThan(0.001);
    expect(easeInOutQuint(0.9)).toBeGreaterThan(0.999);
  });
});

describe('easeOutExpo', () => {
  it('runs 0 → 1 and lands exactly', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(0.5)).toBeCloseTo(1 - 2 ** -5);
  });
});
