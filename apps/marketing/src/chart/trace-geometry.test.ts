import { describe, expect, it } from 'vitest';

import { centreChip, chipTop, nearestIndex, pointAt, tracePaths } from './trace-geometry';

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
    expect(tracePaths([0, 50, 100], 1000, 100)).toEqual({
      active: 'M0.0 100.0 L500.0 50.0 L1000.0 0.0',
      quiet: '',
    });
  });

  it('splits runs between empty buckets into the quiet path', () => {
    expect(tracePaths([10, 0, 0, 0, 10], 400, 10)).toEqual({
      active: 'M0.0 0.0 L100.0 10.0 M300.0 10.0 L400.0 0.0',
      quiet: 'M100.0 10.0 L200.0 10.0 L300.0 10.0',
    });
  });

  it('draws an all-empty window as quiet only', () => {
    expect(tracePaths([0, 0], 100, 10)).toEqual({ active: '', quiet: 'M0.0 10.0 L100.0 10.0' });
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

describe('chipTop', () => {
  it('sits the gap above the plot, growing upward', () => {
    expect(chipTop(80, { top: 300, height: 140 }, 10, 8)).toBe(-90);
  });

  it('goes below the plot when above would leave the viewport', () => {
    expect(chipTop(80, { top: 60, height: 140 }, 10, 8)).toBe(150);
    expect(chipTop(80, { top: 98, height: 140 }, 10, 8)).toBe(-90);
  });
});
