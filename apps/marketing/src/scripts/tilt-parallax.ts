import { DOT_TILT } from '../constants';
import type { Vec, Vec3 } from './tilt-gravity';
import { ZERO } from './tilt-gravity';

// How far the dot field shifts for a device tilted away from how it is held (scripts/dot-tilt.ts).
// Pure: time is passed in, so it is unit-tested.

const RADIANS = Math.PI / 180;

/**
 * The field shifts against the tilt, as things far behind the glass would: right edge down →
 * left, top tipped away → down. The pose it is held in is the baseline: the first reading, then
 * a slow follow (DOT_TILT.baselineMs), so a deliberate tilt holds its shift for many seconds
 * while a phone simply held at a new angle drifts back to centre over half a minute. A turn of
 * the screen, or a change past DOT_TILT.regripDeg (lying it flat, turning toward landscape before
 * the screen follows), is a new grip: the baseline jumps there and the shift glides back to 0.
 * Every filter runs on elapsed time, so a long gap (tab hidden, hero off screen) catches up.
 */
export interface TiltParallax {
  /**
   * The shift at `now` (ms) for `gravity` (a unit vector in canvas axes: scripts/tilt-gravity.ts;
   * null while no usable reading has arrived) on a screen turned `angleDeg`: canvas axes, length
   * 0 to 1 (× DOT_TILT.amplitudePx), smoothed over DOT_TILT.smoothingMs.
   */
  update(gravity: Vec3 | null, angleDeg: number, now: number): Vec;
}

export function createTiltParallax(): TiltParallax {
  let baseline: Vec3 | null = null;
  const shift = { x: 0, y: 0 };
  let lastAt = Number.NaN;
  let angle = 0;
  const regripCos = Math.cos(DOT_TILT.regripDeg * RADIANS);

  return {
    update(gravity, angleDeg, now) {
      const elapsed = Number.isNaN(lastAt) ? 0 : Math.max(0, now - lastAt);
      lastAt = now;
      let target = ZERO;
      if (gravity !== null) {
        if (baseline === null || angleDeg !== angle || dot(baseline, gravity) < regripCos) {
          baseline = { ...gravity };
          angle = angleDeg;
        } else {
          baseline = followUnit(baseline, gravity, share(elapsed, DOT_TILT.baselineMs));
        }
        target = shapeShift(parallax(baseline, gravity));
      }
      const glide = share(elapsed, DOT_TILT.smoothingMs);
      shift.x += (target.x - shift.x) * glide;
      shift.y += (target.y - shift.y) * glide;
      return { x: shift.x, y: shift.y };
    },
  };
}

/**
 * The raw shift (canvas axes) for gravity moved from `baseline` to `gravity`, both unit vectors in
 * canvas axes: sin of the tilt angle, against it. From ω = baseline × gravity, the turn gravity
 * made: a turn about an in-screen axis shifts across that axis (ωx → y, ωy → −x) at any hold, and
 * a turn about the screen's normal (a steering-wheel roll, held upright) shifts against gravity's
 * in-screen sweep. Lying flat this is exactly −(gravity's change in the screen's plane); held
 * upright it still sees tipping the top away, which moves gravity out of that plane.
 */
export function parallax(baseline: Vec3, gravity: Vec3): Vec {
  const turn = cross(baseline, gravity);
  return {
    x: -turn.y + turn.z * baseline.y,
    y: turn.x - turn.z * baseline.x,
  };
}

/**
 * A raw shift → the shift: 0 up to the dead zone, then rising linearly to 1 at saturation and
 * capped there, in the raw shift's direction. Measured from the dead zone's edge, so a shift
 * grows from 0 rather than jumping on as the tilt crosses it.
 */
export function shapeShift(raw: Vec): Vec {
  const { deadZone, saturation } = DOT_TILT;
  const size = Math.hypot(raw.x, raw.y);
  if (size <= deadZone) return ZERO;
  const strength = Math.min(1, (size - deadZone) / (saturation - deadZone));
  return { x: (raw.x / size) * strength, y: (raw.y / size) * strength };
}

/** A first-order low-pass's step: the share of the gap closed in `elapsedMs`. */
function share(elapsedMs: number, tauMs: number): number {
  return 1 - Math.exp(-elapsedMs / tauMs);
}

/** `from` moved `amount` of the way to `to`, back on the unit sphere. */
function followUnit(from: Vec3, to: Vec3, amount: number): Vec3 {
  const x = from.x + (to.x - from.x) * amount;
  const y = from.y + (to.y - from.y) * amount;
  const z = from.z + (to.z - from.z) * amount;
  const size = Math.hypot(x, y, z);
  return size === 0 ? { ...to } : { x: x / size, y: y / size, z: z / size };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
