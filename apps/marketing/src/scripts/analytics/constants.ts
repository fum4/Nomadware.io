// Tunables for analytics + the consent banner.

/** localStorage key holding the visitor's choice. Strictly necessary: it records the choice itself. */
export const CONSENT_STORAGE_KEY = 'nw-consent';

/** The banner shows this long after load, or on the first scroll, whichever comes first. */
export const BANNER_DELAY_MS = 2000;

/** posthog-js loads on the first of these, or this long after `load` (see posthog-client.ts). */
export const ANALYTICS_LOAD_DELAY_MS = 3000;
export const ANALYTICS_LOAD_TRIGGERS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/** Events tracked before posthog-js has loaded wait here; beyond this, the oldest are dropped. */
export const TRACK_QUEUE_LIMIT = 50;

/** Share of the stats strip that must be on screen for `stats_viewed`. */
export const STATS_VIEWED_THRESHOLD = 0.5;

/**
 * Marks DOM whose text is something the visitor typed (the contact terminal's painted copy):
 * masked in session replay and ignored by autocapture. Inputs themselves are always masked.
 */
export const PRIVATE_SELECTOR = '[data-private]';

/** Storage keys posthog-js writes (cookie `ph_<token>_posthog`, localStorage `ph_…`, `__ph_…`). */
export const POSTHOG_STORAGE_PREFIXES = ['ph_', '__ph'] as const;
