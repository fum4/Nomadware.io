// From a `deviceorientation` reading to gravity's pull in the screen's plane (scripts/dot-tilt.ts).
// Pure: no DOM, so it is unit-tested.

/** A 2D vector. */
export interface Vec {
  x: number;
  y: number;
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
 * Gravity's component in the screen's plane, in g, in the device's natural frame (x toward its
 * right edge, y toward its top): what a marble lying on the glass would feel. From the spec's
 * Z-X'-Y'' rotation, g = (sin γ cos β, −sin β, −cos γ cos β); its in-plane part is the first two.
 * Working on the vector rather than the raw angles keeps it continuous where the angles jump:
 * gamma's ±90 wrap and beta near ±90 describe the same pose either way, and give the same vector.
 */
export function planeGravity({ beta, gamma }: TiltReading): Vec {
  const cosBeta = Math.cos(beta * RADIANS);
  return { x: Math.sin(gamma * RADIANS) * cosBeta, y: -Math.sin(beta * RADIANS) };
}

/**
 * `device` (natural frame, y up) in canvas axes (x right, y down) for a screen turned `angleDeg`
 * from the device's natural orientation (screen.orientation.angle: 90 = the device turned a
 * quarter counter-clockwise, top edge to the left). The content is turned back the other way, so
 * the vector turns +angle, then y flips.
 */
export function toCanvas(device: Vec, angleDeg: number): Vec {
  // Screens only turn in quarters; exact cos/sin per quarter, so no 6e-17 leaks across axes.
  const quarter = (((Math.round(angleDeg / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const [cos, sin] = QUARTER_TURNS[quarter];
  return {
    x: device.x * cos - device.y * sin,
    y: -(device.x * sin + device.y * cos),
  };
}
