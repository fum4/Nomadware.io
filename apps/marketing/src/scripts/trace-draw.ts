import { pointsReached } from '../chart/synced-count';
import { TRACE_DRAW } from '../constants';
import type { PulseQueue } from './marker-pulse';

// A range's first showing on the stats card, on one clock: the trace's wipe (a Web Animation on
// the plot's SVG clip, so the browser runs it) and, read from it every frame, how far the pen has
// reached — what the legend counts to and when each caught marker pops.

/** One draw in flight: settles true once drawn, false if cancelled (the plot stays undrawn). */
export interface TraceDraw {
  finished: Promise<boolean>;
  cancel: () => void;
}

/**
 * Run the wipe on `svg` (no SVG: the same clock with nothing to wipe, for a card without a chart),
 * calling `onReach` every frame with the share of the plot's width the pen has reached, 1 last.
 * `onDrawn` runs before the wipe lets go of the clip, so the caller can mark the plot drawn
 * without a frame of it hidden.
 */
export function runTraceDraw(
  svg: SVGSVGElement | null,
  onReach: (reach: number) => void,
  onDrawn: () => void,
): TraceDraw {
  const { durationMs, delayMs, easing, glowPx } = TRACE_DRAW;
  const keyframes = svg
    ? [
        { clipPath: `inset(-${glowPx}px 100% -${glowPx}px -${glowPx}px)` },
        { clipPath: `inset(-${glowPx}px)` },
      ]
    : null;
  const effect = new KeyframeEffect(svg, keyframes, {
    duration: durationMs,
    delay: delayMs,
    easing,
    fill: 'both',
  });
  const animation = new Animation(effect, document.timeline);
  // The clip's right edge runs from the plot's left to glowPx past its right: in plot widths.
  const widthPx = svg?.getBoundingClientRect().width ?? 0;
  const overshoot = widthPx > 0 ? (widthPx + glowPx) / widthPx : 1;

  let frame = 0;
  const tick = (): void => {
    onReach(Math.min(1, (effect.getComputedTiming().progress ?? 0) * overshoot));
    frame = requestAnimationFrame(tick);
  };
  animation.play();
  frame = requestAnimationFrame(tick);

  const finished = animation.finished.then(
    () => {
      cancelAnimationFrame(frame);
      onReach(1);
      onDrawn();
      animation.cancel();
      return true;
    },
    () => {
      cancelAnimationFrame(frame);
      return false;
    },
  );
  return { finished, cancel: () => animation.cancel() };
}

/**
 * Draw one plot of the chart: the wipe, its caught markers popping as the pen reaches their
 * point (each queuing its pulse on `pulses`) (the same `pointsReached` the legend counts with, so a marker and its count
 * land together), and `data-drawn` at the end: from then on the plot shows as is.
 */
export function drawPlot(
  plot: HTMLElement,
  pulses: PulseQueue,
  onReach: (reach: number) => void,
): TraceDraw {
  const points = Number(plot.dataset.points);
  const markers = [...plot.querySelectorAll<HTMLElement>('[data-catch]')].map((element) => ({
    element,
    index: Number(element.dataset.catch),
  }));
  markers.forEach(({ element }) => element.removeAttribute('data-reached'));
  return runTraceDraw(
    plot.querySelector('svg'),
    (reach) => {
      const passed = pointsReached(reach, points);
      const appearing = markers.filter(
        ({ element, index }) => index < passed && !element.hasAttribute('data-reached'),
      );
      appearing.forEach(({ element }) => element.setAttribute('data-reached', ''));
      pulses.add(appearing.map(({ element }) => element));
      onReach(reach);
    },
    () => plot.setAttribute('data-drawn', ''),
  );
}
