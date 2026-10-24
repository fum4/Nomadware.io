import { DOT_TILT } from '../constants';

// From a sensor sample to which way gravity points, in the canvas's axes (scripts/dot-tilt.ts).
// Pure: no DOM, so it is unit-tested.

/** A 2D vector. */
export interface Vec {
  x: number;
  y: number;
}

/** A 3D vector. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A device's tilt in degrees (DeviceOrientationEvent: alpha, the compass heading, is irrelevant). */
export interface TiltReading {
  /** Front-back, −180..180: 0 flat on its back, 90 upright, top edge up. */
  beta: number;
  /** Left-right, −90..90: positive with the right edge down. */
  gamma: number;
}

export const ZERO: Vec = { x: 0, y: 0 };

const RADIANS = Math.PI / 180;
/** Standard gravity, m/s²: DeviceMotionEvent's unit. */
const STANDARD_GRAVITY = 9.80665;
/** [cos, sin] of 0, 90, 180 and 270 degrees. */
const QUARTER_TURNS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;

/**
 * A usable reading, or null: devices without the sensor (and some Android browsers, once, on
 * load) fire the event with null angles.
 */
export function readTilt(beta: number | null, gamma: number | null): TiltReading | null {
  if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) {
    return null;
  }
  return { beta, gamma };
}

/**
 * Gravity's direction (a unit vector) in the device's natural frame (x toward its right edge, y
 * toward its top, z out of the screen), from the spec's Z-X'-Y'' rotation:
 * g = (sin γ cos β, −sin β, −cos γ cos β). Exact for any pose, since alpha turns about gravity.
 */
export function orientationGravity({ beta, gamma }: TiltReading): Vec3 {
  const cosBeta = Math.cos(beta * RADIANS);
  return {
    x: Math.sin(gamma * RADIANS) * cosBeta,
    y: -Math.sin(beta * RADIANS),
    z: -Math.cos(gamma * RADIANS) * cosBeta,
  };
}

/**
 * The same direction from `devicemotion`'s accelerationIncludingGravity (m/s², natural frame):
 * at rest it reads the table's push, −gravity (flat on its back: z = +9.8). Null for a missing
 * or non-finite axis, or a reading too weak to point anywhere (free fall, a dead sensor).
 */
export function motionGravity(
  x: number | null | undefined,
  y: number | null | undefined,
  z: number | null | undefined,
): Vec3 | null {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return null;
  const size = Math.hypot(x, y, z);
  if (!Number.isFinite(size) || size < DOT_TILT.minMotionG * STANDARD_GRAVITY) return null;
  return { x: -x / size, y: -y / size, z: -z / size };
}

/**
 * `device` (natural frame: x right, y up, z out of the screen) in canvas axes (x right, y down,
 * z into the screen; still right-handed) for a screen turned `angleDeg` from the device's natural
 * orientation (screen.orientation.angle: 90 = the device turned a quarter counter-clockwise, top
 * edge to the left). The content is turned back the other way, so the vector turns +angle, then y
 * and z flip.
 */
export function toCanvas(device: Vec3, angleDeg: number): Vec3 {
  // Screens only turn in quarters; exact cos/sin per quarter, so no 6e-17 leaks across axes.
  const quarter = (((Math.round(angleDeg / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const [cos, sin] = QUARTER_TURNS[quarter];
  return {
    x: device.x * cos - device.y * sin,
    y: -(device.x * sin + device.y * cos),
    z: -device.z,
  };
}
