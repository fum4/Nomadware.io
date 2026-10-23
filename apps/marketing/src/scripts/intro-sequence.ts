import {
  INTRO_GAP_MS,
  INTRO_HEADLINE_AT_MS,
  INTRO_TAGS_AT_MS,
  INTRO_WORDMARK_MAX_WAIT_MS,
} from '../constants';
import { scrambleHeadline } from './headline-scramble';
import { initStats } from './stats-card';
import { flickerTags } from './tags-flicker';
import { rotateTags } from './tags-rotate';
import { expandWordmark } from './wordmark-expand';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
/** Until `ms` after navigation start (at once if that has passed). */
const waitUntil = (ms: number): Promise<void> => wait(Math.max(0, ms - performance.now()));

/** User Timing marks (`intro:*`), so the sequence can be checked in DevTools' performance panel. */
const mark = (phase: string): void => void performance.mark(`intro:${phase}`);

/**
 * The page-load choreography: the tags power on at INTRO_TAGS_AT_MS and the headline scramble
 * runs over the readable headline at INTRO_HEADLINE_AT_MS (both from navigation start); from there
 * each step starts when the previous one finishes → gap → stats count-up (once the card is in
 * view) → gap → nav wordmark, and from then on the tags rotate. The wordmark never waits
 * on a card nobody scrolls to: it starts INTRO_WORDMARK_MAX_WAIT_MS after the headline at the
 * latest. Plays whatever `prefers-reduced-motion` says (README § Motion).
 */
export async function playIntro(): Promise<void> {
  const countUp = initStats();

  await waitUntil(INTRO_TAGS_AT_MS);
  mark('tags-start');
  void flickerTags().then(() => mark('tags-end'));
  await waitUntil(INTRO_HEADLINE_AT_MS);
  mark('headline-start');
  await scrambleHeadline();
  mark('headline-end');
  const wordmarkDeadline = wait(INTRO_WORDMARK_MAX_WAIT_MS);
  await wait(INTRO_GAP_MS);

  const stats = countUp().then(() => {
    mark('stats-end');
    return wait(INTRO_GAP_MS);
  });
  await Promise.race([stats, wordmarkDeadline]);
  mark('wordmark-start');
  expandWordmark();
  rotateTags();
}
