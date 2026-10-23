import type { StatWindow } from '@nomadware/site-stats';

// Tunables shared by components and client scripts. Copy lives in the components (except copy a
// script also cycles through, like HERO_TAGS); identity in config/site.ts; data in data/.

/** Same breakpoint as the CSS `@media (max-width: 640px)` in styles/. */
export const MOBILE_QUERY = '(max-width: 640px)';
/** A device where hovering a mouse is the primary input (no auto-focus, no cursor effects otherwise). */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
/** Only the flashing effects listen to it (scripts/motion-policy.ts). */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const SHA_LENGTH = 7;

/**
 * Intro (scripts/intro-sequence.ts): headline scramble → gap → stats count-up → gap → wordmark;
 * the hero tags power on from INTRO_TAGS_AT_SCRAMBLE_SHARE of the way through the scramble.
 */
export const INTRO_GAP_MS = 500;
/** Share of the headline revealed when the tags start powering on (overlapping the scramble). */
export const INTRO_TAGS_AT_SCRAMBLE_SHARE = 0.25;
/**
 * Latest the wordmark starts, counted from the headline settling, when the stats card is below
 * the fold and never scrolled into view. The in-view path takes 500 + 1600 + 500 = 2.6 s, so 4 s
 * still lets a visitor who scrolls straight down see the full order before the nav gives up.
 */
export const INTRO_WORDMARK_MAX_WAIT_MS = 4_000;

/**
 * Hero tags' "power issues" flicker-in (scripts/tags-flicker.ts), started a quarter of the way
 * into the headline scramble and over well before the stats start, so the sequence timing never
 * moves.
 * Each tag starts a random stagger after the last and flickers on over a random duration; a slash
 * lights a random lag after the tag that follows it. The whole run is scaled down if needed so it
 * always ends `budgetMs` after it starts.
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

/**
 * The hero's rotating tags (scripts/tags-rotate.ts): one roster split into four length bands, one
 * band per slot (so a slot is only as wide as its band's longest word), shown in order; the first
 * word of each is the server-rendered line. The bands share no word, so no two slots ever show the
 * same one. Once the intro is done, every `intervalMs` one slot (random, never the same twice
 * running) powers on its band's next word, cycling through the band before repeating.
 */
export const HERO_TAGS = {
  pools: [
    [
      'web apps',
      'realtime',
      'payments',
      'llm apps',
      'copilots',
      'ai tools',
      'insights',
      'devtools',
    ],
    ['backend', 'mobile', 'desktop', 'agents', 'devops'],
    ['automation', 'analytics', 'dashboards', 'prototypes', 'ai search'],
    ['infra', 'cloud', 'ci/cd', 'saas', 'mvps', 'apis'],
  ],
  intervalMs: 2_500,
} as const;

export const WORDMARK_LETTER_DELAY_S = 0.25;
export const WORDMARK_LETTER_STAGGER_S = 0.08;

export const SCRAMBLE_STEP_MS = 40;
export const SCRAMBLE_GLYPHS = '▚▞▙▟01<>/{}#';

export const COUNT_UP_DURATION_MS = 1600;
export const COUNT_UP_VISIBLE_THRESHOLD = 0.3;

export const RELATIVE_TIME_REFRESH_MS = 60_000;

/**
 * The cursor as one field (scripts/cursor-field.ts): the grid lines bend toward it
 * (scripts/grid-warp.ts) and the hero dots gather to it (scripts/dot-field.ts), both with the
 * same radius and falloff, so they read as one force. CSS px.
 */
export const CURSOR_FIELD = {
  radiusPx: 220,
} as const;

/** The grid's bend toward the cursor (scripts/grid-warp.ts). Lengths in CSS px. */
export const GRID_WARP = {
  /** Largest pull on a line, reached about 0.45 × radius from the cursor. */
  maxPullPx: 8,
  /** Distance between the points a bent line is drawn through. */
  sampleStepPx: 10,
  /** Per frame, how far the well's centre closes on the pointer (0–1). */
  follow: 0.22,
  /** Per frame, how far the well's depth eases in while the pointer is on the page (0–1). */
  ease: 0.1,
  /** The well counts as caught up with a still pointer within this distance. */
  settlePx: 0.1,
  /** Once the pointer leaves the page, the bend and its glow drain to rest over this long, easing out. */
  fadeOutMs: 2_800,
  /** Inner share of the radius tinted --grid-glow-core before it turns --grid-glow. */
  glowCoreShare: 0.15,
  /** Below this depth the well counts as gone: the loop stops on a straight grid. */
  restDepth: 0.002,
} as const;

export const DOT_FIELD = {
  /** Dots per 10,000 CSS px² of their home (the content column over the hero). */
  densityDesktop: 5.6,
  densityMobile: 9,
  /** Canvas pixels per CSS pixel; sizes and speeds below are in canvas px. */
  canvasScale: 2,
  /**
   * The frame every per-frame value below is tuned for (60 Hz); other refresh rates scale each
   * step to it, capped at maxStepFrames so a hitch never becomes a leap.
   */
  frameMs: 1000 / 60,
  maxStepFrames: 3,
  highlightShare: 0.15,
  /**
   * On load every dot starts fading in (0 → its colour) on the field's first frame, each over its
   * own random span between appearMinMs and appearMaxMs: the field condenses rather than pops in.
   * A fade, not a flash, so it plays whatever prefers-reduced-motion says (scripts/motion-policy.ts).
   */
  appearMinMs: 400,
  appearMaxMs: 1_600,
  /** How far past the content column the dots' home reaches, CSS px. */
  homeSpillPx: 96,
  /** Per frame, the share of its distance outside home a dot's speed gains back toward it. */
  homePull: 0.0004,
  /**
   * The cursor's pull is gravity / (d² + softening²) at d CSS px, faded to 0 at
   * CURSOR_FIELD.radiusPx like the grid's: about 0.1 halfway out, about 1 at the ring.
   */
  gravity: 2_200,
  gravitySofteningPx: 20,
  /** Canvas px per frame: a falling dot's top speed. */
  maxSpeed: 14,
  /**
   * Inside this many CSS px of the cursor a dot is pushed back out, hard enough that the pull and
   * the crowd behind can't press it in: the gathered dots settle as a ring round an empty core.
   * The ring's radius, black hole or not (BLACK_HOLE sits inside it).
   */
  gatherCorePx: 44,
  gatherCorePush: 3,
  /**
   * Dots closer than this (CSS px) push each other apart (scripts/dot-separation.ts): what packs
   * the gathered dots into an even ring instead of a heap on the side they came from.
   */
  separationPx: 12,
  /** Per frame, the push at zero distance; falls off linearly to 0 at the separation radius. */
  separationForce: 0.4,
  /** The pointer counts as still once it has stayed within stillPx (CSS px) for stillMs. */
  stillPx: 4,
  stillMs: 150,
  /**
   * Friction of captured dots round a still pointer (vs `friction`): they stop orbiting. A
   * released dot starts from it and eases to `friction` over releaseRampMs.
   */
  settleFriction: 0.86,
  /**
   * Once a dot leaves the field it diffuses back over releaseMs: its separation radius widens
   * to releaseSpacingPx (≈ the drift's own spacing at densityDesktop) over releaseRampMs, its
   * jitter gains up to releaseJitter × itself, and both ease back by releaseMs.
   */
  releaseSpacingPx: 40,
  releaseRampMs: 4_000,
  releaseMs: 8_000,
  releaseJitter: 3,
  friction: 0.96,
  jitter: 0.05,
  initialSpeed: 0.4,
  size: 3,
  highlightSize: 4,
  color: 'rgba(236, 235, 243, 0.28)',
  highlightColor: 'rgba(198, 255, 74, 0.9)',
} as const;

/**
 * The black hole that forms where the cursor rests over the hero (scripts/black-hole.ts), drawn
 * on the dot canvas. Mouse-first desktops only, like the dots. Times in ms, lengths in CSS px.
 */
export const BLACK_HOLE = {
  /** The pointer must rest (DOT_FIELD.stillPx) this long before the hole starts to form. */
  appearAfterMs: 1_000,
  /** It seeps in over growMs (ease-out) and fades over fadeMs once the pointer moves or leaves. */
  growMs: 4_500,
  fadeMs: 500,
  /**
   * Horizon radius at full size, well inside the dots' ring (DOT_FIELD.gatherCorePx), so empty
   * page shows between them; it starts at horizonStartShare of it and grows with the hole.
   */
  horizonPx: 15,
  horizonStartShare: 0.4,
  /**
   * The stain: solid black to coreShare of the horizon, haloAlpha at the horizon, fading to
   * nothing at haloShare horizons out.
   */
  coreShare: 0.7,
  haloAlpha: 0.6,
  haloShare: 2.6,
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

/** The range the stats card opens on. */
export const DEFAULT_STAT_WINDOW: StatWindow = '7d';

/** The stats card's activity chart (components/stats-chart.astro, scripts/stats-chart.ts). */
export const STATS_CHART = {
  /** The trace's SVG viewBox; stretched to the plot (preserveAspectRatio none). */
  viewWidth: 1000,
  viewHeight: 140,
  /** The hover tooltip: px below the chart's top edge, and kept from the viewport's sides. */
  tipTopPx: 6,
  tipViewportMarginPx: 8,
} as const;

/** Live stats (data/load-stats.ts): the R2 read gives up after this and the bundled snapshot shows. */
export const STATS_FETCH_TIMEOUT_MS = 1500;
/** Older than this, the snapshot reads as stale: the live dot goes grey and stops pulsing. */
export const STATS_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
/** The page renders on demand with live stats; Vercel's CDN serves it for a minute, then revalidates in the background. */
export const STATS_PAGE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
