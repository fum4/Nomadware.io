import { describe, expect, it } from 'vitest';

import type { Vec3 } from './tilt-gravity';
import { motionGravity, orientationGravity, readTilt, toCanvas } from './tilt-gravity';

const G = 9.80665;

const expectVec = (actual: Vec3, expected: Vec3): void => {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
  expect(actual.z).toBeCloseTo(expected.z, 9);
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

describe('orientationGravity', () => {
  it('points into the table lying flat, to the bottom edge held upright', () => {
    expectVec(orientationGravity({ beta: 0, gamma: 0 }), { x: 0, y: 0, z: -1 });
    expectVec(orientationGravity({ beta: 90, gamma: 0 }), { x: 0, y: -1, z: 0 });
  });

  it('leans to the lower side: right edge as it dips', () => {
    expect(orientationGravity({ beta: 0, gamma: 30 }).x).toBeCloseTo(0.5);
    expect(orientationGravity({ beta: 45, gamma: -20 }).x).toBeLessThan(0);
  });

  it('is continuous across the angles’ jumps: gamma’s ±90 wrap', () => {
    // Upright and rolled: the same pose is reported as γ = +90, β = b or γ = −90, β = 180 − b.
    expectVec(
      orientationGravity({ beta: 80, gamma: 90 }),
      orientationGravity({ beta: 100, gamma: -90 }),
    );
  });

  it('is a unit vector in every pose', () => {
    for (let beta = -180; beta <= 180; beta += 15) {
      for (let gamma = -90; gamma <= 90; gamma += 15) {
        const { x, y, z } = orientationGravity({ beta, gamma });
        expect(Math.hypot(x, y, z)).toBeCloseTo(1, 12);
      }
    }
  });
});

describe('motionGravity', () => {
  it('flips the reaction the accelerometer reads into gravity, as a unit vector', () => {
    expectVec(motionGravity(0, 0, G) ?? { x: 9, y: 9, z: 9 }, { x: 0, y: 0, z: -1 });
    expectVec(motionGravity(0, G, 0) ?? { x: 9, y: 9, z: 9 }, { x: 0, y: -1, z: 0 });
  });

  it('agrees with the orientation event for the same pose', () => {
    for (const pose of [
      { beta: 45, gamma: 0 },
      { beta: 30, gamma: 20 },
      { beta: 70, gamma: -35 },
    ]) {
      const gravity = orientationGravity(pose);
      const sample = motionGravity(-gravity.x * G, -gravity.y * G, -gravity.z * G);
      expectVec(sample ?? { x: 9, y: 9, z: 9 }, gravity);
    }
  });

  it('rejects missing, non-finite and too-weak samples', () => {
    expect(motionGravity(null, null, null)).toBeNull();
    expect(motionGravity(undefined, 0, G)).toBeNull();
    expect(motionGravity(0, Number.NaN, G)).toBeNull();
    expect(motionGravity(0, 0, Number.POSITIVE_INFINITY)).toBeNull();
    expect(motionGravity(0, 0, 0)).toBeNull();
    expect(motionGravity(0.5, 0.5, 0.5)).toBeNull();
  });
});

describe('toCanvas', () => {
  // Held upright in each orientation, gravity must point down the canvas (y grows downward).
  const DOWN = { x: 0, y: 1, z: 0 };

  it('portrait (0): x stays, y and z flip to the canvas', () => {
    expectVec(toCanvas({ x: 0, y: -1, z: 0 }, 0), DOWN);
    expectVec(toCanvas({ x: 0.3, y: 0, z: -0.5 }, 0), { x: 0.3, y: 0, z: 0.5 });
  });

  it('landscape, turned counter-clockwise (90): the device’s left edge is the bottom', () => {
    expectVec(toCanvas({ x: -1, y: 0, z: 0 }, 90), DOWN);
    // The device's top edge points left on screen.
    expectVec(toCanvas({ x: 0, y: 1, z: 0 }, 90), { x: -1, y: 0, z: 0 });
  });

  it('upside down (180): everything mirrors', () => {
    expectVec(toCanvas({ x: 0, y: 1, z: 0 }, 180), DOWN);
    expectVec(toCanvas({ x: 0.3, y: 0, z: 0 }, 180), { x: -0.3, y: 0, z: 0 });
  });

  it('landscape, turned clockwise (270, or the legacy −90): the right edge is the bottom', () => {
    expectVec(toCanvas({ x: 1, y: 0, z: 0 }, 270), DOWN);
    expectVec(toCanvas({ x: 1, y: 0, z: 0 }, -90), DOWN);
    expectVec(toCanvas({ x: 0, y: 1, z: 0 }, 270), { x: 1, y: 0, z: 0 });
  });
});
