import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MARKER_PULSE } from '../constants';
import { createPulseQueue } from './marker-pulse';

interface FakeMarker {
  marker: HTMLElement;
  pulsing: () => boolean;
  /** The browser's animationend: the pulse ran its course. */
  end: () => void;
}

/** Just what the queue touches on a marker, recording when its pulse started. */
function fakeMarker(starts: number[]): FakeMarker {
  let pulsing = false;
  const listeners: (() => void)[] = [];
  const target = {
    offsetWidth: 0,
    removeAttribute: () => void (pulsing = false),
    setAttribute: () => {
      pulsing = true;
      starts.push(performance.now());
    },
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the DOM node
  const marker = target as unknown as HTMLElement;
  const end = (): void => listeners.splice(0).forEach((listener) => listener());
  return { marker, pulsing: () => pulsing, end };
}

describe('createPulseQueue', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('starts each pulse spacingMs after the last, the first at once', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add(
      [fakeMarker(starts), fakeMarker(starts), fakeMarker(starts)].map((fake) => fake.marker),
    );
    vi.runAllTimers();
    const gaps = starts.slice(1).map((at, index) => at - (starts[index] ?? 0));
    expect(starts).toHaveLength(3);
    expect(gaps).toEqual([MARKER_PULSE.spacingMs, MARKER_PULSE.spacingMs]);
  });

  it('tightens the spacing so a long queue drains within maxRippleMs', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add(Array.from({ length: 40 }, () => fakeMarker(starts).marker));
    vi.runAllTimers();
    expect(starts).toHaveLength(40);
    expect((starts.at(-1) ?? 0) - (starts[0] ?? 0)).toBeLessThanOrEqual(MARKER_PULSE.maxRippleMs);
  });

  it('a marker that joins later still waits its turn; cancel drops the rest', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    queue.add([fakeMarker(starts).marker]);
    vi.advanceTimersByTime(10);
    queue.add([fakeMarker(starts).marker, fakeMarker(starts).marker]);
    vi.advanceTimersByTime(MARKER_PULSE.spacingMs);
    queue.cancel();
    vi.runAllTimers();
    expect(starts).toHaveLength(2);
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBe(MARKER_PULSE.spacingMs);
  });

  it('leaves no pulse attribute behind to replay when the plot shows again', () => {
    const queue = createPulseQueue();
    const done = fakeMarker([]);
    const running = fakeMarker([]);
    queue.add([done.marker, running.marker]);
    vi.runAllTimers();
    done.end();
    expect(done.pulsing()).toBe(false);
    expect(running.pulsing()).toBe(true);
    queue.cancel(); // the range is toggled away mid-pulse
    expect(running.pulsing()).toBe(false);
  });

  it('a burst pulses every marker at once, dropping a ripple still waiting', () => {
    const starts: number[] = [];
    const queue = createPulseQueue();
    const rippled = fakeMarker(starts);
    queue.add([fakeMarker(starts).marker, rippled.marker]);
    const burst = [fakeMarker(starts), fakeMarker(starts), fakeMarker(starts)];
    queue.burst(burst.map((fake) => fake.marker));
    vi.runAllTimers();
    expect(starts).toEqual([0, 0, 0]);
    expect(rippled.pulsing()).toBe(false);
    expect(burst.every((fake) => fake.pulsing())).toBe(true);
  });
});
