import { CURSOR_FIELD } from '../constants';

/**
 * The cursor's field strength at `distance` CSS px: 1 at the cursor, easing smoothly to 0 at
 * CURSOR_FIELD.radiusPx and beyond. One curve for every effect that reacts to the cursor (grid
 * bend, dot gather), so they move as one field.
 */
export function fieldStrength(distance: number): number {
  const t = distance / CURSOR_FIELD.radiusPx;
  if (t >= 1) return 0;
  const falloff = 1 - t * t;
  return falloff * falloff;
}

/** Whether the cursor is over a control (CURSOR_FIELD.quietOver), where the field lets go. */
export function overControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(CURSOR_FIELD.quietOver) !== null;
}
