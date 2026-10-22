import { REDUCED_MOTION_QUERY } from '../constants';

/**
 * The site's motion policy, in one place (README § Motion). Every animation plays whatever the
 * visitor's `prefers-reduced-motion` says (owner's call, NWARE-82), except the effects that flash:
 * rapid on/off brightness changes, which reduced motion swaps for a plain fade of at most
 * `--flash-fallback-fade` (tokens.css). WCAG 2.3.1 (three flashes) and 2.3.3 (animation from
 * interactions) are why those two stay opt-out.
 *
 * The flashing effects, and where each one asks:
 * - the hero tags' power-on flicker: `flashingAllowed()` in scripts/tags-flicker.ts
 * - the send button's neon surge on hover: CSS can't call this, so styles/contact-terminal.css
 *   repeats the same media query, next to a pointer back here
 * A new flashing effect joins this list and asks the same question; nothing else checks the query.
 */
export const flashingAllowed = (): boolean => !matchMedia(REDUCED_MOTION_QUERY).matches;
