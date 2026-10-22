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

/**
 * Hero tags' "power issues" flicker-in (scripts/tags-flicker.ts), played inside the gap after the
 * headline, so the sequence timing never moves. Each tag starts a random stagger after the last
 * and flickers on over a random duration; a slash lights a random lag after the tag that follows it.
 * The whole run is scaled down if needed so it always ends `budgetMs` after it starts.
 */
export const TAGS_FLICKER = {
  staggerMinMs: 70,
  staggerMaxMs: 100,
  durationMinMs: 200,
  durationMaxMs: 260,
  slashLagMinMs: 20,
  slashLagMaxMs: 60,
  /** Slashes are one glyph: they settle quicker than a word. */
  slashDurationShare: 0.7,
  /** Irregular on/off steps per element before it settles at full brightness. */
  stepsMin: 4,
  stepsMax: 6,
  budgetMs: INTRO_GAP_MS - 20,
} as const;

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
  /** Field limits, enforced by the client (maxlength, readiness) and the endpoint alike. */
  maxNameLength: 120,
  /** RFC 5321's practical ceiling for a whole address. */
  maxEmailLength: 254,
  minBriefLength: 4,
  maxBriefLength: 4000,
  subjectPrefix: 'New project — ',
  /** The on-demand route the form posts to (src/pages/api/contact.ts). */
  endpoint: '/api/contact',
  /** How long "send" waits for the Turnstile token before giving up. */
  challengeTimeoutMs: 15_000,
} as const;

/** The contact endpoint's server-side tunables (src/contact/, src/pages/api/contact.ts). */
export const CONTACT_API = {
  /** Requests above this are refused before parsing; 4000 chars of brief fit many times over. */
  maxBodyBytes: 32_768,
  /** Per-IP budget, per warm function instance (src/contact/rate-limiter.ts). */
  rateLimitMax: 5,
  rateLimitWindowMs: 60 * 60 * 1000,
  /** Cap on IPs tracked per instance, so a flood can't grow memory without bound. */
  rateLimitMaxTracked: 10_000,
  upstreamTimeoutMs: 8000,
  /** Cloudflare's documented maximum token length. */
  maxTokenLength: 2048,
  turnstileVerifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  resendSendUrl: 'https://api.resend.com/emails',
  from: 'Nomadware site <contact-form@send.nomadware.io>',
} as const;

/** Cloudflare Turnstile in the browser (src/scripts/contact/turnstile.ts). */
export const TURNSTILE = {
  scriptUrl: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  /** Shows UI only when Cloudflare needs an interaction; otherwise invisible. */
  appearance: 'interaction-only',
  action: 'contact',
} as const;
