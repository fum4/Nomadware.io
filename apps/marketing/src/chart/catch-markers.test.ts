import { describe, expect, it } from 'vitest';

import { catchMarkers } from './catch-markers';

const TRACE = [0, 10, 20, 10, 0];

describe('catchMarkers', () => {
  it('puts one marker on the trace per bucket that caught issues', () => {
    expect(catchMarkers(TRACE, [0, 0, 3, 0, 1], 0)).toEqual([
      { index: 2, x: 0.5, y: 0, count: 3, crowded: false },
      { index: 4, x: 1, y: 1, count: 1, crowded: false },
    ]);
  });

  it('crowds out a smaller count next to a larger one, never a single issue', () => {
    const markers = catchMarkers(TRACE, [2, 4, 1, 0, 2], 0.3);
    expect(markers.map((marker) => [marker.index, marker.crowded])).toEqual([
      [0, true],
      [1, false],
      [2, false],
      [4, false],
    ]);
  });

  it('keeps the earlier of two equal counts', () => {
    const markers = catchMarkers(TRACE, [0, 3, 3, 0, 0], 0.3);
    expect(markers.map((marker) => marker.crowded)).toEqual([false, true]);
  });
});
