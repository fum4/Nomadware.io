import {
  INTRO_GAP_MS,
  INTRO_TAGS_AT_SCRAMBLE_SHARE,
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
 * The page-load choreography, each step started by the previous one finishing: headline scramble
 * → gap → stats count-up (once the card is in view) → gap → nav wordmark, and from then on the
 * tags rotate. The tags power on alongside, from INTRO_TAGS_AT_SCRAMBLE_SHARE of the scramble
 * (or when it ends, if it never reports), never lengthening anything. The wordmark never waits
 * on a card nobody scrolls to: it starts INTRO_WORDMARK_MAX_WAIT_MS after the headline at the
 * latest. Plays whatever
 * `prefers-reduced-motion` says; only the tags' flicker swaps for a fade (scripts/motion-policy.ts).
 */
export async function playIntro(): Promise<void> {
  const countUp = initStats();

  let tagsStarted = false;
  const startTags = (): void => {
    if (tagsStarted) return;
    tagsStarted = true;
    mark('tags-start');
    void flickerTags().then(() => mark('tags-end'));
  };

  mark('headline-start');
  await scrambleHeadline((share) => {
    if (share >= INTRO_TAGS_AT_SCRAMBLE_SHARE) startTags();
  });
  mark('headline-end');
  startTags();
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
