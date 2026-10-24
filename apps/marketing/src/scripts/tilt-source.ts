// Which sensor event the tilt listens to (scripts/dot-tilt.ts). Pure, so it is unit-tested.

/**
 * The events that can tell where gravity points, best first: `deviceorientation` (fused, steady),
 * `deviceorientationabsolute` (the same beta/gamma; some Android browsers send only this one),
 * `devicemotion`'s accelerationIncludingGravity (raw: hand shake included, but nearly universal).
 */
export const TILT_SOURCES = ['orientation', 'absolute', 'motion'] as const;
export type TiltSource = (typeof TILT_SOURCES)[number];

export interface SourcePicker {
  /**
   * Whether a usable sample from `source` should be taken. The first source to deliver one is
   * used; a better one that starts delivering later takes over, and a worse one is then ignored,
   * so two sources never take turns.
   */
  accept(source: TiltSource): boolean;
}

export function createSourcePicker(): SourcePicker {
  let current: TiltSource | null = null;
  return {
    accept(source) {
      if (current !== null && TILT_SOURCES.indexOf(source) > TILT_SOURCES.indexOf(current)) {
        return false;
      }
      current = source;
      return true;
    },
  };
}
