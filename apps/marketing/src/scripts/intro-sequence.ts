import { INTRO_HEADLINE_AT_MS, INTRO_TAGS_AT_MS, INTRO_WORDMARK_AT_MS } from '../constants';
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
 * The page-load choreography, on a clock from navigation start: the tags power on at
 * INTRO_TAGS_AT_MS, the headline scramble runs over the readable headline at INTRO_HEADLINE_AT_MS,
 * and the nav wordmark expands at INTRO_WORDMARK_AT_MS (after which the tags rotate). The stats
 * count up straight away, as soon as the card is in view. Plays whatever
 * `prefers-reduced-motion` says (README § Motion).
 */
export async function playIntro(): Promise<void> {
  const countUp = initStats();
  void countUp().then(() => mark('stats-end'));
  void waitUntil(INTRO_WORDMARK_AT_MS).then(() => {
    mark('wordmark-start');
    expandWordmark();
    rotateTags();
  });

  await waitUntil(INTRO_TAGS_AT_MS);
  mark('tags-start');
  void flickerTags().then(() => mark('tags-end'));
  await waitUntil(INTRO_HEADLINE_AT_MS);
  mark('headline-start');
  await scrambleHeadline();
  mark('headline-end');
}
