import { DOT_TILT } from '../constants';
import type { Vec } from './tilt-gravity';
import { ZERO } from './tilt-gravity';

// How far the device leans from the pose it is held in (scripts/dot-tilt.ts). Pure: time is
// passed in, so it is unit-tested.

/**
 * Calibration: the first reading starts a fresh neutral pose, which tracks the smoothed reading for
 * DOT_TILT.calibrationMs (no lean meanwhile); so does a new grip: a turn of the screen, or a change
 * past DOT_TILT.regripChange (rotating to landscape before the screen turns, lying down). After
 * that the neutral pose follows the reading slowly (DOT_TILT.recentreMs), so only a change of tilt
 * leans: held at the new angle the lean fades out, and back at the old one it leans the other way
 * as briefly, then fades. Every filter runs on elapsed time, so a long gap (tab hidden, hero off
 * screen) simply catches the neutral pose up.
 */
export interface TiltLean {
  /**
   * The lean at `now` (ms) for `gravity` (canvas axes, in g: scripts/tilt-gravity.ts; null while
   * no usable reading has arrived) on a screen turned `angleDeg`: a vector of length 0 to 1, 0
   * inside DOT_TILT.deadZone, 1 at DOT_TILT.saturation and beyond.
   */
  update(gravity: Vec | null, angleDeg: number, now: number): Vec;
}

export function createTiltLean(): TiltLean {
  // The smoothed reading and the neutral pose, both in g, canvas axes.
  const signal = { x: 0, y: 0 };
  const neutral = { x: 0, y: 0 };
  // When the current calibration started (NaN: no reading yet), the last update, the screen's turn.
  let calibratedFrom = Number.NaN;
  let lastAt = 0;
  let angle = 0;

  return {
    update(gravity, angleDeg, now) {
      if (gravity === null) return ZERO;
      const elapsed = Math.max(0, now - lastAt);
      lastAt = now;
      if (Number.isNaN(calibratedFrom) || angleDeg !== angle) {
        // A new frame of reference: start the smoothing there too, not from the old axes.
        signal.x = gravity.x;
        signal.y = gravity.y;
        angle = angleDeg;
        calibratedFrom = now;
      } else {
        follow(signal, gravity, elapsed, DOT_TILT.smoothingMs);
      }
      const change = { x: signal.x - neutral.x, y: signal.y - neutral.y };
      if (Math.hypot(change.x, change.y) > DOT_TILT.regripChange) calibratedFrom = now;
      if (now - calibratedFrom < DOT_TILT.calibrationMs) {
        neutral.x = signal.x;
        neutral.y = signal.y;
        return ZERO;
      }
      follow(neutral, signal, elapsed, DOT_TILT.recentreMs);
      return shapeLean({ x: signal.x - neutral.x, y: signal.y - neutral.y });
    },
  };
}

/** Move `state` toward `target` as a first-order low-pass with time constant `tauMs`. */
function follow(state: Vec, target: Vec, elapsedMs: number, tauMs: number): void {
  const share = 1 - Math.exp(-elapsedMs / tauMs);
  state.x += (target.x - state.x) * share;
  state.y += (target.y - state.y) * share;
}

/**
 * A change of tilt (g) → the lean: 0 up to the dead zone, then rising linearly to 1 at
 * saturation and capped there, in the change's direction. Measured from the dead zone's edge, so
 * a lean grows from 0 rather than jumping on as the change crosses it.
 */
export function shapeLean(change: Vec): Vec {
  const { deadZone, saturation } = DOT_TILT;
  const size = Math.hypot(change.x, change.y);
  if (size <= deadZone) return ZERO;
  const strength = Math.min(1, (size - deadZone) / (saturation - deadZone));
  return { x: (change.x / size) * strength, y: (change.y / size) * strength };
}
