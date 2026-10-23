import type { StatKey, StatWindow } from '@nomadware/site-stats';
import { isStatKey, isStatWindow } from '@nomadware/site-stats';

import { DEFAULT_STAT_WINDOW } from '../constants';
import { formatStat } from '../format/format-stat';

// The stats legend's numbers in the page (components/stat-value.astro): read them, keep their
// width steady while they count, and paint a value. stats-card.ts decides which values, when.

export interface StatElement {
  element: HTMLElement;
  key: StatKey;
  values: Partial<Record<StatWindow, number>>;
  /** The value on screen right now (mid-count too), where the next count starts from. */
  shown: number;
}

function parseValues(raw: string | undefined): Partial<Record<StatWindow, number>> {
  const parsed: unknown = JSON.parse(raw ?? '{}');
  const values: Partial<Record<StatWindow, number>> = {};
  if (typeof parsed !== 'object' || parsed === null) return values;
  for (const [range, value] of Object.entries(parsed)) {
    if (isStatWindow(range) && typeof value === 'number') values[range] = value;
  }
  return values;
}

export function readStats(root: HTMLElement): StatElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-stat]')].flatMap((element) => {
    const key = element.dataset.stat;
    if (!isStatKey(key)) return [];
    const values = parseValues(element.dataset.values);
    return [{ element, key, values, shown: values[DEFAULT_STAT_WINDOW] ?? 0 }];
  });
}

export const targetsOf = (stats: StatElement[], range: StatWindow): number[] =>
  stats.map((stat) => stat.values[range] ?? 0);

/**
 * Pin each stat's width to the wider of what it shows now and its target, so a count in either
 * direction never moves a neighbour. In-between values print with the larger end's precision
 * (`paintValues`), which is never wider than that end.
 */
export function lockWidths(stats: StatElement[], targets: number[]): void {
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

/**
 * Show `values` (one per stat), printed with the precision of `precisions` (a count's larger
 * end); `settled` prints each as itself, the count's last frame.
 */
export function paintValues(
  stats: StatElement[],
  values: number[],
  precisions: number[],
  settled: boolean,
): void {
  stats.forEach((stat, index) => {
    const value = values[index] ?? 0;
    stat.shown = value;
    const text = settled
      ? formatStat(stat.key, value)
      : formatStat(stat.key, value, precisions[index] ?? value);
    // Every frame of a count: only a changed number touches the DOM.
    if (stat.element.textContent !== text) stat.element.textContent = text;
  });
}
