// Tunables shared by components and client scripts. Copy lives in the components; identity in
// config/site.ts; data in data/.

/** Same breakpoint as the CSS `@media (max-width: 640px)` in styles/. */
export const MOBILE_QUERY = '(max-width: 640px)';
/** A device where hovering a mouse is the primary input (no auto-focus, no cursor repel otherwise). */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const SHA_LENGTH = 7;

/** Intro (scripts/intro-sequence.ts): headline scramble → gap → stats count-up → gap → wordmark. */
export const INTRO_GAP_MS = 500;
/**
 * Latest the wordmark starts, counted from the headline settling, when the stats strip is below
 * the fold and never scrolled into view. The in-view path takes 500 + 1600 + 500 = 2.6 s, so 4 s
 * still lets a visitor who scrolls straight down see the full order before the nav gives up.
 */
export const INTRO_WORDMARK_MAX_WAIT_MS = 4_000;

export const WORDMARK_LETTER_DELAY_S = 0.25;
export const WORDMARK_LETTER_STAGGER_S = 0.08;

export const SCRAMBLE_STEP_MS = 40;
export const SCRAMBLE_GLYPHS = '▚▞▙▟01<>/{}#';

export const COUNT_UP_DURATION_MS = 1600;
export const COUNT_UP_VISIBLE_THRESHOLD = 0.3;

export const RELATIVE_TIME_REFRESH_MS = 60_000;

export const DOT_FIELD = {
  countDesktop: 253,
  countMobile: 120,
  /** Canvas pixels per CSS pixel; sizes, speeds and the repel radius below are in canvas px. */
  canvasScale: 2,
  highlightShare: 0.15,
  repelRadius: 200,
  repelForce: 0.6,
  friction: 0.96,
  jitter: 0.05,
  initialSpeed: 0.4,
  size: 3,
  highlightSize: 4,
  color: 'rgba(236, 235, 243, 0.28)',
  highlightColor: 'rgba(198, 255, 74, 0.9)',
} as const;

export const CONTACT = {
  /** Form auto-focuses "name" once this share of it is on screen (desktop only). */
  autoFocusThreshold: 0.6,
  typingIdleMs: 500,
  minBriefLength: 4,
  subjectPrefix: 'New project — ',
} as const;
