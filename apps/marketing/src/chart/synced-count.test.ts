import type { StatSeries } from '@nomadware/site-stats';
import { describe, expect, it } from 'vitest';

import { countAlong, pointsReached } from './synced-count';
import { pointAt } from './trace-geometry';

const series = (patch: Partial<StatSeries>): StatSeries => ({
  bucketHours: 2,
  agentMinutes: [0, 0, 0, 0, 0],
  prsMerged: [0, 0, 0, 0, 0],
  linesAdded: [0, 0, 0, 0, 0],
  linesDeleted: [0, 0, 0, 0, 0],
  runs: [0, 0, 0, 0, 0],
  actions: [0, 0, 0, 0, 0],
  checks: [0, 0, 0, 0, 0],
  caught: [0, 0, 0, 0, 0],
  caughtFixMinutes: [null, null, null, null, null],
  caughtCategories: [null, null, null, null, null],
  ...patch,
});

describe('pointsReached', () => {
  it('passes a point on arriving at it, the first at once', () => {
    expect(pointsReached(0, 5)).toBe(1);
    expect(pointsReached(0.24, 5)).toBe(1);
    expect(pointsReached(0.25, 5)).toBe(2);
    expect(pointsReached(1, 5)).toBe(5);
    expect(pointsReached(1.2, 5)).toBe(5);
    expect(pointsReached(-0.1, 5)).toBe(0);
  });

  it('agrees with where the chart draws each point', () => {
    const values = Array.from({ length: 120 }, () => 1);
    for (let index = 0; index < values.length; index += 1) {
      expect(pointsReached(pointAt(values, index).x, values.length)).toBe(index + 1);
    }
  });
});

describe('countAlong', () => {
  it('holds over a flat stretch and steps with each bucket, landing on the total', () => {
    const at = countAlong('prs', 10, series({ prsMerged: [0, 0, 6, 0, 4] }));
    expect([0, 0.25, 0.49, 0.5, 0.74, 0.99, 1].map(at)).toEqual([0, 0, 0, 6, 6, 6, 10]);
  });

  it('steps one caught issue per issue on the trace, the rest of the window there at once', () => {
    const at = countAlong('caught', 5, series({ caught: [0, 1, 0, 2, 0] }));
    expect([0, 0.25, 0.75, 1].map(at)).toEqual([2, 3, 5, 5]);
  });

  it('counts agent-hours along agent-minutes', () => {
    const at = countAlong('agentHours', 3, series({ agentMinutes: [60, 0, 60, 0, 60] }));
    expect([0, 0.5, 1].map(at)).toEqual([1, 2, 3]);
  });

  it('never goes below zero when the series sums past the total', () => {
    const at = countAlong('agentHours', 1, series({ agentMinutes: [0, 0, 60, 0, 59] }));
    expect(at(0)).toBe(0);
    expect(at(1)).toBe(1);
  });

  it('follows the pen without a series', () => {
    const at = countAlong('runs', 40, undefined);
    expect([0, 0.5, 1].map(at)).toEqual([0, 20, 40]);
  });
});
