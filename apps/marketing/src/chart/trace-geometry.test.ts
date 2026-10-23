import { describe, expect, it } from 'vitest';

import { centreChip, linePath, nearestIndex, pointAt } from './trace-geometry';

const BOUNDS = { left: -20, right: 500 };
const CHIP_WIDTH = 200;

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

describe('pointAt', () => {
  it('puts the largest value at the top and zero on the baseline', () => {
    const values = [0, 30, 120, 60];
    expect(pointAt(values, 2)).toEqual({ x: 2 / 3, y: 0 });
    expect(pointAt(values, 0)).toEqual({ x: 0, y: 1 });
    expect(pointAt(values, 3)).toEqual({ x: 1, y: 0.5 });
  });

  it('draws the same points the tooltip snaps to', () => {
    expect(linePath([0, 50, 100], 1000, 100)).toBe('M0.0 100.0 L500.0 50.0 L1000.0 0.0');
  });
});

describe('centreChip', () => {
  it('centres on the point', () => {
    expect(centreChip(250, CHIP_WIDTH, BOUNDS)).toBe(150);
  });

  it('stays inside the bounds near either edge', () => {
    expect(centreChip(10, CHIP_WIDTH, BOUNDS)).toBe(-20);
    expect(centreChip(490, CHIP_WIDTH, BOUNDS)).toBe(300);
  });

  it('keeps its left edge in on a box narrower than the chip', () => {
    expect(centreChip(100, CHIP_WIDTH, { left: 0, right: 150 })).toBe(0);
  });
});
