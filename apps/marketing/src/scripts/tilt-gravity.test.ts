import { describe, expect, it } from 'vitest';

import type { Vec } from './tilt-gravity';
import { planeGravity, readTilt, toCanvas } from './tilt-gravity';

const expectVec = (actual: Vec, expected: Vec): void => {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
};

describe('readTilt', () => {
  it('rejects the all-null event of a device without the sensor, and non-finite angles', () => {
    expect(readTilt(null, null)).toBeNull();
    expect(readTilt(45, null)).toBeNull();
    expect(readTilt(null, 10)).toBeNull();
    expect(readTilt(Number.NaN, 0)).toBeNull();
    expect(readTilt(45, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('keeps real angles, zeros included', () => {
    expect(readTilt(0, 0)).toEqual({ beta: 0, gamma: 0 });
    expect(readTilt(45, -12)).toEqual({ beta: 45, gamma: -12 });
  });
});

describe('planeGravity', () => {
  it('is 0 lying flat, and points to the bottom edge held upright', () => {
    expectVec(planeGravity({ beta: 0, gamma: 0 }), { x: 0, y: 0 });
    expectVec(planeGravity({ beta: 90, gamma: 0 }), { x: 0, y: -1 });
  });

  it('points to the lower side: bottom edge as the top lifts, right edge as it dips', () => {
    expectVec(planeGravity({ beta: 30, gamma: 0 }), { x: 0, y: -0.5 });
    expectVec(planeGravity({ beta: 0, gamma: 30 }), { x: 0.5, y: 0 });
    expect(planeGravity({ beta: 45, gamma: -20 }).x).toBeLessThan(0);
  });

  it('is continuous across the angles’ jumps: gamma’s ±90 wrap, beta past 90', () => {
    // Upright and rolled: the same pose is reported as γ = +90, β = b or γ = −90, β = 180 − b.
    expectVec(planeGravity({ beta: 80, gamma: 90 }), planeGravity({ beta: 100, gamma: -90 }));
    expectVec(
      planeGravity({ beta: 89.9, gamma: 89.9 }),
      planeGravity({ beta: 90.1, gamma: -89.9 }),
    );
    // Through face down β wraps 180 → −180: 0.2° apart in pose, a hair apart in gravity.
    const before = planeGravity({ beta: 179.9, gamma: 5 });
    const after = planeGravity({ beta: -179.9, gamma: 5 });
    expect(Math.hypot(before.x - after.x, before.y - after.y)).toBeLessThan(0.004);
  });

  it('is a component of a unit vector, so never longer than 1 g', () => {
    for (let beta = -180; beta <= 180; beta += 15) {
      for (let gamma = -90; gamma <= 90; gamma += 15) {
        const { x, y } = planeGravity({ beta, gamma });
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(1 + 1e-12);
      }
    }
  });
});

describe('toCanvas', () => {
  // Held upright in each orientation, gravity must point down the canvas (y grows downward).
  const DOWN = { x: 0, y: 1 };

  it('portrait (0): x stays, y flips to the canvas', () => {
    expectVec(toCanvas({ x: 0, y: -1 }, 0), DOWN);
    expectVec(toCanvas({ x: 0.3, y: 0 }, 0), { x: 0.3, y: 0 });
  });

  it('landscape, turned counter-clockwise (90): the device’s left edge is the bottom', () => {
    expectVec(toCanvas({ x: -1, y: 0 }, 90), DOWN);
    // The device's top edge points left on screen.
    expectVec(toCanvas({ x: 0, y: 1 }, 90), { x: -1, y: 0 });
  });

  it('upside down (180): everything mirrors', () => {
    expectVec(toCanvas({ x: 0, y: 1 }, 180), DOWN);
    expectVec(toCanvas({ x: 0.3, y: 0 }, 180), { x: -0.3, y: 0 });
  });

  it('landscape, turned clockwise (270, or the legacy −90): the right edge is the bottom', () => {
    expectVec(toCanvas({ x: 1, y: 0 }, 270), DOWN);
    expectVec(toCanvas({ x: 1, y: 0 }, -90), DOWN);
    expectVec(toCanvas({ x: 0, y: 1 }, 270), { x: 1, y: 0 });
  });

  it('end to end: rolling the right edge down pushes right in portrait, down in 270', () => {
    const rolled = planeGravity({ beta: 0, gamma: 20 });
    expect(toCanvas(rolled, 0).x).toBeGreaterThan(0);
    expect(toCanvas(rolled, 270).y).toBeGreaterThan(0);
    expect(toCanvas(rolled, 90).y).toBeLessThan(0);
  });
});
