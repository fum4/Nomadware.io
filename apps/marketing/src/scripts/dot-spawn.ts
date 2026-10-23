import { DOT_FIELD } from '../constants';
import type { FlungBody } from './dot-burst';
import { easeOutCubic } from './easing';

// A hero dot's birth (dot-field.ts): where it starts, its own traits, how it fades in on load.

export interface Dot extends FlungBody {
  highlight: boolean;
  /** Inside the cursor's field this frame. */
  captured: boolean;
  /** When it last left the field (performance.now()), -Infinity if never. */
  releasedAt: number;
  /** Its own ring radius around the cursor: a fixed nudge and a wobble phase (ringRadius). */
  ringOffsetPx: number;
  ringPhase: number;
  /** How long its fade-in on load takes, from the field's first frame. */
  appearMs: number;
}

/** Where dots live and drift back to (canvas px). */
export interface Home {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A field's worth of dots for `home` at `density` per 10,000 CSS px², scattered over it. */
export function spawnDots(home: Home, density: number, scale: number): Dot[] {
  const area = ((home.right - home.left) / scale) * ((home.bottom - home.top) / scale);
  const count = Math.round((area * density) / 10_000);
  return Array.from({ length: count }, () => ({
    x: home.left + Math.random() * (home.right - home.left),
    y: home.top + Math.random() * (home.bottom - home.top),
    vx: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
    vy: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
    highlight: Math.random() < DOT_FIELD.highlightShare,
    captured: false,
    releasedAt: Number.NEGATIVE_INFINITY,
    flungAt: Number.NEGATIVE_INFINITY,
    ringOffsetPx: (Math.random() * 2 - 1) * DOT_FIELD.ringScatterPx,
    ringPhase: Math.random() * 2 * Math.PI,
    appearMs:
      DOT_FIELD.appearMinMs + Math.random() * (DOT_FIELD.appearMaxMs - DOT_FIELD.appearMinMs),
  }));
}

/** A dot's opacity `sinceFirstMs` after the field's first frame, or null once every dot is in. */
export function appearAlpha(dot: Dot, sinceFirstMs: number): number | null {
  if (sinceFirstMs >= DOT_FIELD.appearMaxMs) return null;
  // Eased out: most of its brightness in the first moments, so the field shows up at once.
  return easeOutCubic(Math.min(1, sinceFirstMs / dot.appearMs));
}
