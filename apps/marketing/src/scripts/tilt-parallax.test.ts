import { describe, expect, it } from 'vitest';

import { DOT_TILT } from '../constants';
import type { Vec, Vec3 } from './tilt-gravity';
import { motionGravity, orientationGravity, toCanvas } from './tilt-gravity';
import type { TiltParallax } from './tilt-parallax';
import { createTiltParallax, parallax, shapeShift } from './tilt-parallax';

const FRAME_MS = 1000 / 60;
const RADIANS = Math.PI / 180;
const length = (vec: Vec): number => Math.hypot(vec.x, vec.y);
/** Gravity in canvas axes for a portrait pose. */
const pose = (beta: number, gamma: number): Vec3 =>
  toCanvas(orientationGravity({ beta, gamma }), 0);

/** The same portrait pose, through devicemotion's accelerometer sample. */
function viaMotion(beta: number, gamma: number): Vec3 {
  const g = orientationGravity({ beta, gamma });
  const sample = motionGravity(-g.x * 9.8, -g.y * 9.8, -g.z * 9.8);
  return toCanvas(sample ?? { x: 0, y: 0, z: 0 }, 0);
}

/** `gravity` fed every frame for `ms` from `from`; the last shift, the time, the peak length. */
function hold(
  tilt: TiltParallax,
  gravity: Vec3 | null,
  from: number,
  ms: number,
  angle = 0,
): { last: Vec; now: number; peak: number } {
  let last: Vec = { x: 0, y: 0 };
  let peak = 0;
  let now = from;
  for (; now < from + ms; now += FRAME_MS) {
    last = tilt.update(gravity, angle, now);
    peak = Math.max(peak, length(last));
  }
  return { last, now, peak };
}

// Held at 45° in portrait, the common reading pose.
const REST = pose(45, 0);

describe('parallax: against the tilt, in every hold', () => {
  it('nothing without a change', () => {
    expect(length(parallax(REST, REST))).toBeCloseTo(0, 12);
  });

  it('right edge down → left; left edge down → right', () => {
    expect(parallax(pose(0, 0), pose(0, 20)).x).toBeCloseTo(-Math.sin(20 * RADIANS));
    expect(parallax(REST, pose(45, 20)).x).toBeLessThan(-0.2);
    expect(parallax(REST, pose(45, -20)).x).toBeGreaterThan(0.2);
    expect(Math.abs(parallax(REST, pose(45, 20)).y)).toBeLessThan(0.05);
  });

  it('top tipped away → down; toward you → up, by sin of the angle at any hold', () => {
    for (const held of [10, 45, 80]) {
      const away = parallax(pose(held, 0), pose(held - 20, 0));
      expect(away.y).toBeCloseTo(Math.sin(20 * RADIANS));
      expect(away.x).toBeCloseTo(0);
      expect(parallax(pose(held, 0), pose(held + 10, 0)).y).toBeLessThan(0);
    }
  });

  it('held upright, a steering-wheel roll (right edge down) → left', () => {
    const upright = toCanvas({ x: 0, y: -1, z: 0 }, 0);
    const sin = Math.sin(20 * RADIANS);
    const rolled = toCanvas({ x: sin, y: -Math.cos(20 * RADIANS), z: 0 }, 0);
    expect(parallax(upright, rolled).x).toBeCloseTo(-sin);
    expect(parallax(upright, rolled).y).toBeCloseTo(0);
  });

  it('landscape either way round: the same as portrait, in the screen’s own terms', () => {
    const s = Math.SQRT1_2;
    const sin = Math.sin(20 * RADIANS);
    const cos = Math.cos(20 * RADIANS);
    // Held at 45°, the screen's right edge dipped 20°, in each landscape: canvas-frame identical.
    const portrait = parallax(REST, { x: s * sin, y: s, z: s * cos });
    // 90: the device's left edge is the bottom, its bottom edge the screen's right.
    const ccw = parallax(
      toCanvas({ x: -s, y: 0, z: -s }, 90),
      toCanvas({ x: -s, y: -s * sin, z: -s * cos }, 90),
    );
    // 270: the device's right edge is the bottom, its top edge the screen's right.
    const cw = parallax(
      toCanvas({ x: s, y: 0, z: -s }, 270),
      toCanvas({ x: s, y: s * sin, z: -s * cos }, 270),
    );
    expect(portrait.x).toBeLessThan(-0.2);
    for (const turned of [ccw, cw]) {
      expect(turned.x).toBeCloseTo(portrait.x);
      expect(turned.y).toBeCloseTo(portrait.y);
    }
  });

  it('from devicemotion, the same shift as from deviceorientation', () => {
    const expected = parallax(REST, pose(30, 15));
    const actual = parallax(viaMotion(45, 0), viaMotion(30, 15));
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
  });
});

describe('shapeShift', () => {
  it('ignores tremor inside the dead zone', () => {
    expect(shapeShift({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(length(shapeShift({ x: DOT_TILT.deadZone * 0.99, y: 0 }))).toBe(0);
  });

  it('grows from 0 at the dead zone, linearly, to 1 at saturation, capped there', () => {
    const { deadZone, saturation } = DOT_TILT;
    expect(length(shapeShift({ x: deadZone + 1e-9, y: 0 }))).toBeCloseTo(0, 6);
    expect(shapeShift({ x: (deadZone + saturation) / 2, y: 0 }).x).toBeCloseTo(0.5);
    expect(shapeShift({ x: 0, y: -saturation }).y).toBeCloseTo(-1);
    expect(length(shapeShift({ x: 0.6, y: 0.8 }))).toBeCloseTo(1);
  });

  it('saturates around 20°, and a 2° wobble is swallowed', () => {
    expect(length(shapeShift({ x: Math.sin(20 * RADIANS), y: 0 }))).toBeCloseTo(1, 2);
    expect(length(shapeShift({ x: Math.sin(1.9 * RADIANS), y: 0 }))).toBe(0);
  });
});

describe('createTiltParallax', () => {
  it('is 0 without a usable reading, and at rest in any pose', () => {
    const tilt = createTiltParallax();
    expect(hold(tilt, null, 0, 1_000).peak).toBe(0);
    expect(hold(tilt, REST, 1_000, 10_000).peak).toBe(0);
    expect(hold(createTiltParallax(), pose(80, -30), 0, 10_000).peak).toBe(0);
  });

  it('glides to the full shift within a few smoothing constants, no snap', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, REST, 0, 1_000);
    // One frame in: a sliver of the way.
    const first = tilt.update(pose(25, 0), 0, rested.now);
    expect(length(first)).toBeGreaterThan(0);
    expect(length(first)).toBeLessThan(0.2);
    const glided = hold(tilt, pose(25, 0), rested.now + FRAME_MS, 5 * DOT_TILT.smoothingMs);
    expect(glided.last.y).toBeGreaterThan(0.9);
  });

  it('a tilt held still keeps most of its shift for 10 s, then drifts back to centre', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, REST, 0, 1_000);
    const held = hold(tilt, pose(45, 25), rested.now, 10_000);
    expect(held.last.x).toBeLessThan(-0.5);
    const later = hold(tilt, pose(45, 25), held.now, 4 * DOT_TILT.baselineMs);
    expect(length(later.last)).toBeLessThan(0.01);
  });

  it('tremor inside the dead zone never shifts; a small tilt shifts a little', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, REST, 0, 1_000);
    expect(hold(tilt, pose(46.5, 1), rested.now, 1_000).peak).toBe(0);
    const small = hold(tilt, pose(45, 8), rested.now + 1_000, 1_000);
    expect(small.last.x).toBeLessThan(-0.1);
    expect(small.last.x).toBeGreaterThan(-0.5);
  });

  it('a turn of the screen is a new grip: the shift glides back to 0 there', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, REST, 0, 1_000);
    const tilted = hold(tilt, pose(45, 20), rested.now, 1_000);
    expect(length(tilted.last)).toBeGreaterThan(0.5);
    const turned = hold(tilt, toCanvas({ x: -0.7, y: 0, z: -0.7 }, 90), tilted.now, 1_000, 90);
    expect(length(turned.last)).toBeLessThan(0.001);
  });

  it('a turn past regripDeg (laid flat) is a new grip, then tilts work there', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, pose(80, 0), 0, 1_000);
    const flat = hold(tilt, pose(0, 0), rested.now, 1_000);
    expect(length(flat.last)).toBeLessThan(0.001);
    const rolled = hold(tilt, pose(0, 20), flat.now, 1_000);
    expect(rolled.last.x).toBeLessThan(-0.9);
  });

  it('after a long gap (tab hidden) the held pose has caught up: no lurch', () => {
    const tilt = createTiltParallax();
    const rested = hold(tilt, REST, 0, 1_000);
    expect(length(tilt.update(pose(45, 20), 0, rested.now + 300_000))).toBeLessThan(0.001);
  });
});
