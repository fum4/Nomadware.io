import { DOT_FIELD } from '../constants';
import { overControl } from './cursor-field';

// The pointer over the hero, as the dot field (dot-field.ts) sees it: where it is (canvas px)
// and how long it has rested.

const OFF_SCREEN = -9_999;

export interface DotPointer {
  /** Canvas px; meaningless while `active()` is false. */
  readonly position: { x: number; y: number };
  /** Over the hero right now. */
  active(): boolean;
  /** How long it has stayed within DOT_FIELD.stillPx of where it last moved from. */
  stillForMs(now: number): number;
}

/** Track the pointer over `host` in `canvas` px (× scale). Mouse-first desktops wire this. */
export function trackPointer(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  scale: number,
): DotPointer {
  const position = { x: OFF_SCREEN, y: OFF_SCREEN };
  // Where the pointer last moved more than stillPx from, and when: it is still once stillMs pass.
  const anchor = { x: OFF_SCREEN, y: OFF_SCREEN, at: 0 };
  host.addEventListener('pointermove', (event) => {
    // Over a control the dots let go, as if the cursor had left the hero.
    if (overControl(event.target)) {
      position.x = OFF_SCREEN;
      position.y = OFF_SCREEN;
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    position.x = (event.clientX - bounds.left) * scale;
    position.y = (event.clientY - bounds.top) * scale;
    if (Math.hypot(position.x - anchor.x, position.y - anchor.y) > DOT_FIELD.stillPx * scale) {
      anchor.x = position.x;
      anchor.y = position.y;
      anchor.at = event.timeStamp;
    }
  });
  host.addEventListener('pointerleave', () => {
    position.x = OFF_SCREEN;
    position.y = OFF_SCREEN;
  });
  return {
    position,
    active: () => position.x !== OFF_SCREEN,
    stillForMs: (now) => now - anchor.at,
  };
}

/** For a device that never tracks the pointer (touch, phones): always away. */
export const NO_POINTER: DotPointer = {
  position: { x: OFF_SCREEN, y: OFF_SCREEN },
  active: () => false,
  stillForMs: () => 0,
};
