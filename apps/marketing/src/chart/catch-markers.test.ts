import { describe, expect, it } from 'vitest';

import { catchMarkers } from './catch-markers';

const TRACE = [0, 10, 20, 10, 0];

describe('catchMarkers', () => {
  it('puts one marker on the trace per bucket that caught issues', () => {
    const markers = catchMarkers(TRACE, [0, 0, 1, 0, 1]);
    expect(markers.map(({ index, x, y }) => ({ index, x, y }))).toEqual([
      { index: 2, x: 0.5, y: 0 },
      { index: 4, x: 1, y: 1 },
    ]);
  });

  it('grows its area with the count, from a single issue up to twice it', () => {
    const [one, two, many] = catchMarkers(TRACE, [1, 2, 40, 0, 0]);
    expect(one?.scale).toBe(1);
    expect(two?.scale).toBeGreaterThan(1);
    expect(two?.scale).toBeLessThan(Math.SQRT2);
    expect(many?.scale).toBe(Math.SQRT2);
  });
});
