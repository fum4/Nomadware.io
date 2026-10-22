import { INTRO_GAP_MS, INTRO_WORDMARK_MAX_WAIT_MS } from '../constants';
import { scrambleHeadline } from './headline-scramble';
import { initStats } from './stats-strip';
import { flickerTags } from './tags-flicker';
import { expandWordmark } from './wordmark-expand';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** User Timing marks (`intro:*`), so the sequence can be checked in DevTools' performance panel. */
const mark = (phase: string): void => void performance.mark(`intro:${phase}`);

/**
 * The page-load choreography, each step started by the previous one finishing: headline scramble
 * → gap (the hero tags flicker on inside it, never lengthening it) → stats count-up (once the
 * strip is in view) → gap → nav wordmark. The wordmark never waits on a strip nobody scrolls to:
 * it starts INTRO_WORDMARK_MAX_WAIT_MS after the headline at the latest. Plays whatever
 * `prefers-reduced-motion` says; only the tags' flicker swaps for a fade (scripts/motion-policy.ts).
 */
export async function playIntro(): Promise<void> {
  const countUp = initStats();

  mark('headline-start');
  await scrambleHeadline();
  mark('headline-end');
  const wordmarkDeadline = wait(INTRO_WORDMARK_MAX_WAIT_MS);
  mark('tags-start');
  void flickerTags().then(() => mark('tags-end'));
  await wait(INTRO_GAP_MS);

  const stats = countUp().then(() => {
    mark('stats-end');
    return wait(INTRO_GAP_MS);
  });
  await Promise.race([stats, wordmarkDeadline]);
  mark('wordmark-start');
  expandWordmark();
}
