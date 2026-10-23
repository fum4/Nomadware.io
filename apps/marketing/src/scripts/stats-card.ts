import type { StatKey, StatWindow } from '@nomadware/site-stats';
import { isStatKey, isStatWindow } from '@nomadware/site-stats';

import {
  COUNT_UP_DURATION_MS,
  COUNT_UP_VISIBLE_THRESHOLD,
  DEFAULT_STAT_WINDOW,
} from '../constants';
import { formatStat } from '../format/format-stat';
import { STATS_VIEWED_THRESHOLD } from './analytics/constants';
import { track } from './analytics/track';
import { onceVisible } from './motion';
import { initStatsChart } from './stats-chart';

interface StatElement {
  element: HTMLElement;
  key: StatKey;
  values: Partial<Record<StatWindow, number>>;
  /** The value on screen right now (mid-count too), where the next count starts from. */
  shown: number;
}

const easeOutExpo = (progress: number): number =>
  progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress);

function parseValues(raw: string | undefined): Partial<Record<StatWindow, number>> {
  const parsed: unknown = JSON.parse(raw ?? '{}');
  const values: Partial<Record<StatWindow, number>> = {};
  if (typeof parsed !== 'object' || parsed === null) return values;
  for (const [range, value] of Object.entries(parsed)) {
    if (isStatWindow(range) && typeof value === 'number') values[range] = value;
  }
  return values;
}

function readStats(root: HTMLElement): StatElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-stat]')].flatMap((element) => {
    const key = element.dataset.stat;
    if (!isStatKey(key)) return [];
    const values = parseValues(element.dataset.values);
    return [{ element, key, values, shown: values[DEFAULT_STAT_WINDOW] ?? 0 }];
  });
}

interface Count {
  from: number;
  to: number;
}

const targetsOf = (stats: StatElement[], range: StatWindow): number[] =>
  stats.map((stat) => stat.values[range] ?? 0);

/**
 * Pin each stat's width to the wider of what it shows now and its target, so a count in either
 * direction never moves a neighbour. In-between values print with the larger end's precision
 * (`paint`), which is never wider than that end.
 */
function lockWidths(stats: StatElement[], targets: number[]): void {
  stats.forEach((stat) => (stat.element.style.minWidth = ''));
  const current = stats.map((stat) => stat.element.offsetWidth);
  const texts = stats.map((stat) => stat.element.textContent);
  stats.forEach((stat, index) => {
    stat.element.textContent = formatStat(stat.key, targets[index] ?? 0);
  });
  const target = stats.map((stat) => stat.element.offsetWidth);
  stats.forEach((stat, index) => {
    stat.element.textContent = texts[index] ?? '';
    stat.element.style.minWidth = `${Math.max(current[index] ?? 0, target[index] ?? 0)}px`;
  });
}

function paint(stats: StatElement[], counts: Count[], progress: number): void {
  const eased = easeOutExpo(progress);
  stats.forEach((stat, index) => {
    const { from, to } = counts[index] ?? { from: 0, to: 0 };
    stat.shown = progress >= 1 ? to : from + (to - from) * eased;
    stat.element.textContent =
      progress >= 1
        ? formatStat(stat.key, to)
        : formatStat(stat.key, stat.shown, Math.max(from, to));
  });
}

/** Bumped by every `show`, so a toggle mid-count stops the older count instead of racing it. */
let latestShow = 0;

/**
 * Show one range; resolves when its numbers have settled (or a newer `show` took over). Every
 * number counts from what it shows now (0 in the intro, the other range's value on a toggle, the
 * in-flight value on a toggle mid-count) to its target, ease-out-expo, inside its locked width.
 */
function show(stats: StatElement[], range: StatWindow): Promise<void> {
  const run = ++latestShow;
  const targets = targetsOf(stats, range);
  const counts = stats.map((stat, index) => ({ from: stat.shown, to: targets[index] ?? 0 }));
  lockWidths(stats, targets);
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number): void => {
      if (run !== latestShow) return resolve();
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      paint(stats, counts, progress);
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/**
 * Wire the 7d/30d toggle (numbers and chart; the chart's tooltip goes back to the peak) and hold
 * the numbers at 0 for the intro. Returns the intro's count-up: it waits until the card is in
 * view, then resolves when the count settles (at once if the visitor already picked a range).
 */
export function initStats(): () => Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-stats]');
  if (!root) return () => Promise.resolve();
  const stats = readStats(root);
  const labels = [...root.querySelectorAll<HTMLElement>('[data-range-label]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-range]')];
  let picked = false;
  let current: StatWindow = DEFAULT_STAT_WINDOW;
  const chart = initStatsChart(root);

  // Analytics only: independent of the intro's count-up, which has its own visibility gate.
  onceVisible(root, STATS_VIEWED_THRESHOLD, () => track('stats_viewed', { window: current }));

  // Hold at 0 for the intro's count-up, in the final width.
  const finals = targetsOf(stats, DEFAULT_STAT_WINDOW);
  lockWidths(stats, finals);
  paint(
    stats,
    finals.map((to) => ({ from: 0, to })),
    0,
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
      void show(stats, range);
    }),
  );

  return () =>
    picked
      ? Promise.resolve()
      : new Promise((resolve) =>
          onceVisible(root, COUNT_UP_VISIBLE_THRESHOLD, () => {
            if (picked) return resolve();
            performance.mark('intro:stats-start');
            resolve(show(stats, DEFAULT_STAT_WINDOW));
          }),
        );
}
