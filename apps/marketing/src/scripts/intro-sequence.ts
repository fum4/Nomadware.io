import {
  INTRO_GAP_MS,
  INTRO_HEADLINE_DELAY_MS,
  INTRO_TAGS_LEAD_MS,
  INTRO_WORDMARK_MAX_WAIT_MS,
} from '../constants';
import { scrambleHeadline } from './headline-scramble';
import { initStats } from './stats-card';
import { flickerTags } from './tags-flicker';
import { rotateTags } from './tags-rotate';
import { expandWordmark } from './wordmark-expand';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** User Timing marks (`intro:*`), so the sequence can be checked in DevTools' performance panel. */
const mark = (phase: string): void => void performance.mark(`intro:${phase}`);

/**
 * The page-load choreography, each step started by the previous one finishing: a beat
 * (INTRO_HEADLINE_DELAY_MS, the headline already readable) → headline scramble over it
 * → gap → stats count-up (once the card is in view) → gap → nav wordmark, and from then on the
 * tags rotate. The tags power on INTRO_TAGS_LEAD_MS before the scramble, never lengthening
 * anything. The wordmark never waits
 * on a card nobody scrolls to: it starts INTRO_WORDMARK_MAX_WAIT_MS after the headline at the
 * latest. Plays whatever `prefers-reduced-motion` says (README § Motion).
 */
export async function playIntro(): Promise<void> {
  const countUp = initStats();

  await wait(INTRO_HEADLINE_DELAY_MS - INTRO_TAGS_LEAD_MS);
  mark('tags-start');
  void flickerTags().then(() => mark('tags-end'));
  await wait(INTRO_TAGS_LEAD_MS);
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
