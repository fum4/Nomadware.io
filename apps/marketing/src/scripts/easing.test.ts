import { describe, expect, it } from 'vitest';

import { easeOutCubic, easeOutExpo } from './easing';

describe('easeOutCubic', () => {
  it('runs 0 → 1, most of the way early', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});

describe('easeOutExpo', () => {
  it('runs 0 → 1 and lands exactly', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(0.5)).toBeCloseTo(1 - 2 ** -5);
  });
});
