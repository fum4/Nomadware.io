import { describe, expect, it } from 'vitest';

import type { SettleFrame } from './settle-watch';
import { createSettleWatch } from './settle-watch';

const OPTIONS = { viewportFrames: 2, scrollQuietMs: 300, maxWaitMs: 2000 };
const FRAME = 16;
const still = (scrollY = 100, height = 470, offsetTop = 0): SettleFrame => ({
  viewport: [height, offsetTop],
  scrollY,
});

/** Feeds `frames`, one per animation frame from t = 0, and returns the verdicts. */
const run = (frames: readonly SettleFrame[]): string[] => {
  const watch = createSettleWatch(OPTIONS, 0);
  return frames.map((frame, index) => watch.observe(frame, index * FRAME));
};

describe('createSettleWatch', () => {
  it('settles once the scroll has held for scrollQuietMs and the viewport for 2 frames', () => {
    const verdicts = run(Array.from({ length: 30 }, () => still()));
    // 300 ms at 16 ms a frame: frame 19 is the first at or past it.
    expect(verdicts.indexOf('settled')).toBe(19);
  });

  it("waits out iOS's animated scroll-to-focus, however long it runs", () => {
    const scrolling = Array.from({ length: 40 }, (_, index) => still(100 + index * 10));
    const verdicts = run([...scrolling, ...Array.from({ length: 30 }, () => still(490))]);
    expect(verdicts.slice(0, 58)).not.toContain('settled');
    // The last scroll step lands on frame 39 (490): 300 ms later is frame 39 + 19.
    expect(verdicts.indexOf('settled')).toBe(58);
  });

  it('waits for the keyboard to stop resizing the visual viewport', () => {
    const sliding = Array.from({ length: 25 }, (_, index) => still(100, 800 - index * 13));
    const verdicts = run([...sliding, ...Array.from({ length: 5 }, () => still(100, 470))]);
    expect(verdicts.slice(0, 26)).not.toContain('settled');
    expect(verdicts[27]).toBe('settled');
  });

  it('times out when the scroll never holds still', () => {
    const watch = createSettleWatch(OPTIONS, 0);
    let verdict = 'wait';
    for (let frame = 0; verdict === 'wait'; frame += 1) {
      verdict = watch.observe(still(frame), frame * FRAME);
    }
    expect(verdict).toBe('timed-out');
  });
});
