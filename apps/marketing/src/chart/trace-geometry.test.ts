import { describe, expect, it } from 'vitest';

import { linePath, nearestIndex, peakOf, placeChip, pointAt } from './trace-geometry';

const BOUNDS = { left: -20, top: -20, right: 500, bottom: 160 };
const CHIP = { width: 200, height: 48 };

describe('nearestIndex', () => {
  it('snaps to the nearest point', () => {
    expect(nearestIndex(0, 84)).toBe(0);
    expect(nearestIndex(1, 84)).toBe(83);
    expect(nearestIndex(0.5, 84)).toBe(42);
    expect(nearestIndex(10.4 / 83, 84)).toBe(10);
    expect(nearestIndex(10.6 / 83, 84)).toBe(11);
  });

  it('clamps a pointer past either end onto the plot', () => {
    expect(nearestIndex(-0.2, 120)).toBe(0);
    expect(nearestIndex(1.3, 120)).toBe(119);
    expect(nearestIndex(0.7, 1)).toBe(0);
  });
});

describe('pointAt and peakOf', () => {
  it('puts the peak at the top and zero on the baseline', () => {
    const values = [0, 30, 120, 60];
    expect(peakOf(values)).toEqual({ index: 2, value: 120 });
    expect(pointAt(values, 2)).toEqual({ x: 2 / 3, y: 0 });
    expect(pointAt(values, 0)).toEqual({ x: 0, y: 1 });
    expect(pointAt(values, 3)).toEqual({ x: 1, y: 0.5 });
  });

  it('draws the same points the tooltip snaps to', () => {
    expect(linePath([0, 50, 100], 1000, 100)).toBe('M0.0 100.0 L500.0 50.0 L1000.0 0.0');
  });
});

describe('placeChip', () => {
  it('sits right of the point, centred on it', () => {
    expect(placeChip({ x: 100, y: 70 }, CHIP, BOUNDS, 10)).toEqual({ left: 110, top: 46 });
  });

  it('flips left near the right edge', () => {
    expect(placeChip({ x: 400, y: 70 }, CHIP, BOUNDS, 10)).toEqual({ left: 190, top: 46 });
  });

  it('never leaves the left edge on a box too narrow for either side', () => {
    const narrow = { ...BOUNDS, right: 250 };
    expect(placeChip({ x: 120, y: 70 }, CHIP, narrow, 10).left).toBe(-20);
  });

  it('stays inside the top and bottom', () => {
    expect(placeChip({ x: 100, y: 0 }, CHIP, BOUNDS, 10).top).toBe(-20);
    expect(placeChip({ x: 100, y: 160 }, CHIP, BOUNDS, 10).top).toBe(112);
  });
});
