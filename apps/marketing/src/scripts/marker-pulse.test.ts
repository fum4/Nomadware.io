import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MARKER_PULSE } from '../constants';
import { createPulseQueue } from './marker-pulse';

/** Just what the queue touches on a marker, recording when its pulse started. */
function fakeMarker(starts: number[]): HTMLElement {
  const marker = {
    offsetWidth: 0,
    removeAttribute: () => undefined,
    setAttribute: () => void starts.push(performance.now()),
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the DOM node
  return marker as unknown as HTMLElement;
}

describe('createPulseQueue', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('starts each pulse spacingMs after the last, the first at once', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add([fakeMarker(starts), fakeMarker(starts), fakeMarker(starts)]);
    vi.runAllTimers();
    const gaps = starts.slice(1).map((at, index) => at - (starts[index] ?? 0));
    expect(starts).toHaveLength(3);
    expect(gaps).toEqual([MARKER_PULSE.spacingMs, MARKER_PULSE.spacingMs]);
  });

  it('tightens the spacing so a long queue drains within maxRippleMs', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add(Array.from({ length: 40 }, () => fakeMarker(starts)));
    vi.runAllTimers();
    expect(starts).toHaveLength(40);
    expect((starts.at(-1) ?? 0) - (starts[0] ?? 0)).toBeLessThanOrEqual(MARKER_PULSE.maxRippleMs);
  });

  it('a marker that joins later still waits its turn; cancel drops the rest', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add([fakeMarker(starts)]);
    vi.advanceTimersByTime(10);
    queue.add([fakeMarker(starts), fakeMarker(starts)]);
    vi.advanceTimersByTime(MARKER_PULSE.spacingMs);
    queue.cancel();
    vi.runAllTimers();
    expect(starts).toHaveLength(2);
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBe(MARKER_PULSE.spacingMs);
  });
});
