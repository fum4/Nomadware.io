import type { Vec, Vec3 } from './tilt-gravity';
import { motionGravity, orientationGravity, readTilt, toCanvas, ZERO } from './tilt-gravity';
import { createTiltParallax } from './tilt-parallax';
import type { TiltSource } from './tilt-source';
import { createSourcePicker } from './tilt-source';

// The device's tilt, as the dot field (dot-field.ts) shows it: the whole field shifted against
// the tilt, a parallax (scripts/tilt-parallax.ts, DOT_TILT).

export interface DotTilt {
  /**
   * The field's shift at `now` (performance.now()), canvas axes, length 0 to 1: the caller scales
   * it by DOT_TILT.amplitudePx and each dot's depth.
   */
  offset(now: number): Vec;
}

/**
 * Listen to every event that can say where gravity points (scripts/tilt-source.ts picks one):
 * `deviceorientation`, `deviceorientationabsolute`, `devicemotion`. All are secure-context only
 * (https or localhost). The handlers only keep the latest usable sample; the math runs once per
 * animation frame, in `offset`. No permission is requested: where the browser gates the sensors
 * behind one (iOS Safari) no events arrive and the shift stays 0, as on a device without them.
 */
export function trackTilt(): DotTilt {
  let latest: Vec3 | null = null;
  const picker = createSourcePicker();
  const take = (source: TiltSource, gravity: Vec3 | null): void => {
    // An all-null sample (no sensor) never replaces a real one, nor claims the source.
    if (gravity !== null && picker.accept(source)) latest = gravity;
  };
  const options = { passive: true } as const;
  window.addEventListener(
    'deviceorientation',
    (event) => take('orientation', fromOrientation(event)),
    options,
  );
  window.addEventListener(
    'deviceorientationabsolute',
    (event) => take('absolute', fromOrientation(event)),
    options,
  );
  window.addEventListener(
    'devicemotion',
    (event) => {
      const sample = event.accelerationIncludingGravity;
      take('motion', motionGravity(sample?.x, sample?.y, sample?.z));
    },
    options,
  );
  const parallax = createTiltParallax();
  return {
    offset(now) {
      const angle = screenAngle();
      return parallax.update(latest === null ? null : toCanvas(latest, angle), angle, now);
    },
  };
}

/** Gravity from an orientation event, or null for an all-null one. */
function fromOrientation(event: DeviceOrientationEvent): Vec3 | null {
  const reading = readTilt(event.beta, event.gamma);
  return reading === null ? null : orientationGravity(reading);
}

/** For a mouse-first device: no tilt. */
export const NO_TILT: DotTilt = { offset: () => ZERO };

/** How far the screen is turned from the device's natural orientation, degrees. */
function screenAngle(): number {
  if ('orientation' in screen && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }
  // Older WebViews: the deprecated window.orientation (−90, 0, 90, 180).
  const legacy: unknown = Reflect.get(window, 'orientation');
  return typeof legacy === 'number' ? legacy : 0;
}
