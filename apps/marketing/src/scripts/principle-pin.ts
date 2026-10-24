import { MOBILE_MAX_WIDTH, PRINCIPLE_SWITCHER } from '../constants';

/**
 * Whether How we work pins its switcher at this viewport size (scripts/principle-switcher.ts):
 * tall enough for a stage, by the breakpoint's own bar (PRINCIPLE_SWITCHER.pinMinHeight).
 * Elsewhere the principles stack.
 */
export function canPinAt(width: number, height: number): boolean {
  const { phone, wide } = PRINCIPLE_SWITCHER.pinMinHeight;
  return height >= (width <= MOBILE_MAX_WIDTH ? phone : wide);
}
