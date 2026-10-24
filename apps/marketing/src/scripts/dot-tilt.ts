import { DOT_TILT } from '../constants';
import type { TiltReading, Vec } from './tilt-gravity';
import { planeGravity, readTilt, toCanvas, ZERO } from './tilt-gravity';
import { createTiltLean } from './tilt-lean';

// The device's tilt, as the dot field (dot-field.ts) feels it: a small pull toward the screen's
// lower side while the phone leans away from how it is held (DOT_TILT).

export interface DotTilt {
  /** The pull at `now` (performance.now()), canvas px per frame², in the field's dt scaling. */
  pull(now: number): Vec;
}

/**
 * Listen to `deviceorientation` (Android; secure contexts only, so https or localhost). The
 * handler only keeps the latest usable reading; the math runs once per animation frame, in
 * `pull`. No permission is requested: where the browser gates the sensor behind one (iOS Safari)
 * no events arrive and the pull stays 0, as on a device without a gyroscope.
 */
export function trackTilt(): DotTilt {
  let latest: TiltReading | null = null;
  window.addEventListener(
    'deviceorientation',
    (event) => {
      // An all-null event (no sensor) never replaces a real reading.
      latest = readTilt(event.beta, event.gamma) ?? latest;
    },
    { passive: true },
  );
  const lean = createTiltLean();
  return {
    pull(now) {
      const angle = screenAngle();
      const gravity = latest === null ? null : toCanvas(planeGravity(latest), angle);
      const { x, y } = lean.update(gravity, angle, now);
      return { x: x * DOT_TILT.accel, y: y * DOT_TILT.accel };
    },
  };
}

/** For a mouse-first device: no tilt. */
export const NO_TILT: DotTilt = { pull: () => ZERO };

/** How far the screen is turned from the device's natural orientation, degrees. */
function screenAngle(): number {
  if ('orientation' in screen && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }
  // Older WebViews: the deprecated window.orientation (−90, 0, 90, 180).
  const legacy: unknown = Reflect.get(window, 'orientation');
  return typeof legacy === 'number' ? legacy : 0;
}
