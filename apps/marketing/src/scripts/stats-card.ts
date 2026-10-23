import type { StatWindow } from '@nomadware/site-stats';
import { isStatWindow } from '@nomadware/site-stats';

import { countAlong } from '../chart/synced-count';
import { COUNT_UP_TOGGLE_MS, COUNT_UP_VISIBLE_THRESHOLD, DEFAULT_STAT_WINDOW } from '../constants';
import { STATS_VIEWED_THRESHOLD } from './analytics/constants';
import { track } from './analytics/track';
import { easeOutExpo } from './easing';
import { onceVisible } from './motion';
import type { StatElement } from './stat-elements';
import { lockWidths, paintValues, readStats, targetsOf } from './stat-elements';
import type { StatsChart } from './stats-chart';
import { initStatsChart } from './stats-chart';
import type { TraceDraw } from './trace-draw';

/** Bumped by every count, so a toggle mid-count stops the older one instead of racing it. */
let latestCount = 0;

/**
 * A range's first showing: its trace draws and every number counts in step with the pen, from 0
 * to its total (synced-count.ts). Resolves when drawn (true) or cut short by a toggle (false).
 */
function drawRange(
  stats: StatElement[],
  chart: StatsChart,
  range: StatWindow,
): { draw: TraceDraw; drawn: Promise<boolean> } {
  const run = ++latestCount;
  const targets = targetsOf(stats, range);
  lockWidths(stats, targets);
  const counters = stats.map((stat, index) =>
    countAlong(stat.key, targets[index] ?? 0, chart.series?.[range]),
  );
  const draw = chart.draw(range, (reach) => {
    if (run === latestCount) {
      paintValues(
        stats,
        counters.map((at) => at(reach)),
        targets,
        false,
      );
    }
  });
  const drawn = draw.finished.then((done) => {
    if (done && run === latestCount) paintValues(stats, targets, targets, true);
    return done;
  });
  return { draw, drawn };
}

/**
 * A toggle to a range already drawn: every number counts from what it shows now (the in-flight
 * value on a toggle mid-count) to its target, a near-instant start that lands softly.
 */
function recount(stats: StatElement[], range: StatWindow): void {
  const run = ++latestCount;
  const targets = targetsOf(stats, range);
  const from = stats.map((stat) => stat.shown);
  const precisions = targets.map((to, index) => Math.max(from[index] ?? 0, to));
  lockWidths(stats, targets);
  const start = performance.now();
  const step = (now: number): void => {
    if (run !== latestCount) return;
    const progress = Math.min(1, (now - start) / COUNT_UP_TOGGLE_MS);
    const eased = easeOutExpo(progress);
    const values = targets.map(
      (to, index) => (from[index] ?? 0) + (to - (from[index] ?? 0)) * eased,
    );
    paintValues(stats, progress >= 1 ? targets : values, precisions, progress >= 1);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Wire the 7d/30d toggle (numbers and chart; the chart's tooltip hides) and hold the numbers at 0
 * for the intro. Each range draws once, the first time it shows (the default one in the intro, a
 * toggle's on its click); after that a toggle recounts. A toggle mid-draw cancels it: that range
 * draws again next time. Returns the intro's draw: it waits until the card is in view, then
 * resolves when drawn (at once if the visitor already picked a range).
 */
export function initStats(): () => Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-stats]');
  if (!root) return () => Promise.resolve();
  const stats = readStats(root);
  const labels = [...root.querySelectorAll<HTMLElement>('[data-range-label]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-range]')];
  let picked = false;
  let current: StatWindow = DEFAULT_STAT_WINDOW;
  const drawnRanges = new Set<StatWindow>();
  let inFlight: TraceDraw | null = null;
  const chart = initStatsChart(root);

  const show = (range: StatWindow): Promise<void> => {
    inFlight?.cancel();
    if (drawnRanges.has(range)) {
      recount(stats, range);
      chart.pulse(range);
      return Promise.resolve();
    }
    const { draw, drawn } = drawRange(stats, chart, range);
    inFlight = draw;
    return drawn.then((done) => {
      if (done) drawnRanges.add(range);
    });
  };

  // Analytics only: independent of the intro's draw, which has its own visibility gate.
  onceVisible(root, STATS_VIEWED_THRESHOLD, () => track('stats_viewed', { window: current }));

  // Hold at 0 for the intro's draw, in the final width.
  const finals = targetsOf(stats, DEFAULT_STAT_WINDOW);
  lockWidths(stats, finals);
  paintValues(
    stats,
    finals.map(() => 0),
    finals,
    false,
  );

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const range = button.dataset.range;
      if (!isStatWindow(range) || button.getAttribute('aria-pressed') === 'true') return;
      picked = true;
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      labels.forEach((label) =>
        label.toggleAttribute('data-current', label.dataset.rangeLabel === range),
      );
      current = range;
      chart.reset();
      track('stats_window_toggled', { window: range });
      void show(range);
    }),
  );

  return () =>
    picked
      ? Promise.resolve()
      : new Promise((resolve) =>
          onceVisible(root, COUNT_UP_VISIBLE_THRESHOLD, () => {
            if (picked) return resolve();
            performance.mark('intro:stats-start');
            resolve(show(DEFAULT_STAT_WINDOW));
          }),
        );
}
