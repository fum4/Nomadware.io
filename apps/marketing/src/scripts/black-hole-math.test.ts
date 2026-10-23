import { describe, expect, it } from 'vitest';

import { advanceProgress, easeOutCubic, lerp } from './black-hole-math';

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

describe('lerp', () => {
  it('runs from → to', () => {
    expect(lerp(44, 20, 0)).toBe(44);
    expect(lerp(44, 20, 0.5)).toBe(32);
    expect(lerp(44, 20, 1)).toBe(20);
  });
});
