/** What a settle watch makes of one more frame. */
export type SettleVerdict = 'wait' | 'settled' | 'timed-out';

export interface SettleWatchOptions {
  /** The visual viewport (height, offsetTop) unchanged for this many consecutive frames… */
  viewportFrames: number;
  /** …and the scroll position unchanged for this long: the browser's focus scroll is done. */
  scrollQuietMs: number;
  /** Not settled by then: stop waiting. */
  maxWaitMs: number;
}

export interface SettleFrame {
  /** The visual viewport's height and offsetTop. */
  viewport: readonly number[];
  scrollY: number;
}

export interface SettleWatch {
  /** One frame's geometry, once per animation frame. */
  observe(frame: SettleFrame, now: number): SettleVerdict;
}

const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Says, frame by frame, when the browser has finished moving the page after a focus: the visual
 * viewport (the keyboard's slide, a pan) has held for `viewportFrames` frames in a row and the
 * scroll position for `scrollQuietMs`. Geometry rather than events or a fixed delay, because
 * iOS's animated scroll-to-focus runs in the browser's UI process, lasts longer the further it
 * has to go, and doesn't reliably fire the events a timer would listen for.
 */
export function createSettleWatch(options: SettleWatchOptions, startedAt: number): SettleWatch {
  const { viewportFrames, scrollQuietMs, maxWaitMs } = options;
  let viewport: readonly number[] | undefined;
  let viewportStable = 0;
  let scrollY: number | undefined;
  let scrolledAt = startedAt;
  return {
    observe(frame, now) {
      if (viewport && same(viewport, frame.viewport)) viewportStable += 1;
      else {
        viewport = frame.viewport;
        viewportStable = 0;
      }
      if (frame.scrollY !== scrollY) {
        scrollY = frame.scrollY;
        scrolledAt = now;
      }
      if (viewportStable >= viewportFrames && now - scrolledAt >= scrollQuietMs) return 'settled';
      return now - startedAt >= maxWaitMs ? 'timed-out' : 'wait';
    },
  };
}
