import { describe, expect, it } from 'vitest';

import { DOT_TILT } from '../constants';
import type { Vec } from './tilt-gravity';
import { createTiltLean, shapeLean } from './tilt-lean';

const FRAME_MS = 1000 / 60;
const length = (vec: Vec): number => Math.hypot(vec.x, vec.y);

/** A lean fed `gravity` every frame for `ms`, from `from`; returns the last lean and the time. */
function hold(
  lean: ReturnType<typeof createTiltLean>,
  gravity: Vec,
  from: number,
  ms: number,
  angle = 0,
): { last: Vec; now: number; peak: number } {
  let last: Vec = { x: 0, y: 0 };
  let peak = 0;
  let now = from;
  for (; now < from + ms; now += FRAME_MS) {
    last = lean.update(gravity, angle, now);
    peak = Math.max(peak, length(last));
  }
  return { last, now, peak };
}

// Held at 45°, in canvas axes (y down): gravity's in-plane part points to the bottom edge.
const REST = { x: 0, y: Math.SQRT1_2 };

describe('shapeLean', () => {
  it('ignores tremor inside the dead zone', () => {
    expect(shapeLean({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(length(shapeLean({ x: DOT_TILT.deadZone * 0.99, y: 0 }))).toBe(0);
  });

  it('grows from 0 at the dead zone, linearly, to 1 at saturation, capped there', () => {
    const { deadZone, saturation } = DOT_TILT;
    expect(length(shapeLean({ x: deadZone + 1e-9, y: 0 }))).toBeCloseTo(0, 6);
    expect(shapeLean({ x: (deadZone + saturation) / 2, y: 0 }).x).toBeCloseTo(0.5);
    expect(shapeLean({ x: 0, y: -saturation }).y).toBeCloseTo(-1);
    expect(length(shapeLean({ x: 0.6, y: 0.8 }))).toBeCloseTo(1);
  });

  it('keeps the change’s direction', () => {
    const lean = shapeLean({ x: 0.3, y: -0.4 });
    expect(lean.x / lean.y).toBeCloseTo(0.3 / -0.4);
  });
});

describe('createTiltLean', () => {
  it('is 0 until a usable reading arrives, and through calibration', () => {
    const lean = createTiltLean();
    expect(lean.update(null, 0, 0)).toEqual({ x: 0, y: 0 });
    const calibrating = hold(lean, REST, 0, DOT_TILT.calibrationMs - FRAME_MS);
    expect(calibrating.peak).toBe(0);
  });

  it('a phone at rest in any pose never leans', () => {
    const lean = createTiltLean();
    expect(hold(lean, REST, 0, 10_000).peak).toBe(0);
  });

  it('leans toward the newly lower side, then fades out within ≈ 2 × recentreMs', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    // Rolled ≈ 24° right: the right side is lower, so the lean points right (+x).
    const tilted = { x: 0.3, y: REST.y };
    const first = hold(lean, tilted, rested.now, 300);
    expect(first.last.x).toBeGreaterThan(0.5);
    expect(Math.abs(first.last.y)).toBeLessThan(1e-9);
    const settled = hold(lean, tilted, first.now, 2 * DOT_TILT.recentreMs + 500);
    expect(length(settled.last)).toBe(0);
  });

  it('back to the old pose: leans the other way, then nothing', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    const tilted = hold(lean, { x: 0, y: 0.95 }, rested.now, 10_000);
    expect(length(tilted.last)).toBe(0);
    const back = hold(lean, REST, tilted.now, 300);
    // More upright pushed down (+y); back toward flat pushes up (−y).
    expect(back.last.y).toBeLessThan(-0.5);
    expect(length(hold(lean, REST, back.now, 2 * DOT_TILT.recentreMs).last)).toBe(0);
  });

  it('a small tilt leans a little, tremor not at all', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    const shaky = hold(lean, { x: DOT_TILT.deadZone * 0.8, y: REST.y }, rested.now, 300);
    expect(shaky.peak).toBe(0);
    const small = hold(lean, { x: 0.12, y: REST.y }, shaky.now, 300);
    expect(small.peak).toBeGreaterThan(0.1);
    expect(small.peak).toBeLessThan(0.5);
  });

  it('a turn of the screen recalibrates instead of leaning', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    const turned = hold(lean, { x: 0.7, y: 0 }, rested.now, 300, 90);
    expect(turned.peak).toBe(0);
  });

  it('after a long gap (tab hidden) the neutral pose has caught up: no lurch', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    const tilted = { x: 0.3, y: REST.y };
    expect(length(lean.update(tilted, 0, rested.now + 60_000))).toBe(0);
  });
});

describe('createTiltLean, new grips', () => {
  it('a change past regripChange (turning toward landscape) recalibrates, then tilts work there', () => {
    const lean = createTiltLean();
    const rested = hold(lean, REST, 0, 1_000);
    // Turned a quarter, before the screen follows: gravity now points to the old left edge.
    // A snap turn: the smoothed reading leans only for the few frames before it crosses the line.
    const sideways = { x: -Math.SQRT1_2, y: 0 };
    let leaning = 0;
    let now = rested.now;
    for (; now < rested.now + 1_000; now += FRAME_MS) {
      if (length(lean.update(sideways, 0, now)) > 0) leaning += 1;
    }
    expect(leaning).toBeLessThanOrEqual(6);
    expect(length(lean.update(sideways, 0, now))).toBe(0);
    const tilted = hold(lean, { x: -Math.SQRT1_2, y: 0.25 }, now, 300);
    expect(tilted.last.y).toBeGreaterThan(0.5);
  });
});
