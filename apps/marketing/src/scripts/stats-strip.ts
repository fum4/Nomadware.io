import { COUNT_UP_DURATION_MS, COUNT_UP_VISIBLE_THRESHOLD } from '../constants';
import type { StatKey, StatWindow } from '../data/stats-snapshot';
import { DEFAULT_STAT_WINDOW, isStatKey, isStatWindow } from '../data/stats-snapshot';
import { formatStat } from '../format/format-stat';
import { onceVisible, prefersReducedMotion } from './motion';

interface StatElement {
  element: HTMLElement;
  key: StatKey;
  values: Partial<Record<StatWindow, number>>;
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
    return isStatKey(key) ? [{ element, key, values: parseValues(element.dataset.values) }] : [];
  });
}

/** Render each stat's final value for `range` and pin that width, so counting never moves a neighbour. */
function lockFinals(stats: StatElement[], range: StatWindow): number[] {
  const finals = stats.map((stat) => stat.values[range] ?? 0);
  stats.forEach((stat, index) => {
    stat.element.style.minWidth = '';
    stat.element.textContent = formatStat(stat.key, finals[index] ?? 0);
  });
  stats.forEach((stat) => (stat.element.style.minWidth = `${stat.element.offsetWidth}px`));
  return finals;
}

function paint(stats: StatElement[], finals: number[], progress: number): void {
  stats.forEach((stat, index) => {
    const final = finals[index] ?? 0;
    stat.element.textContent = formatStat(stat.key, final * easeOutExpo(progress), final);
  });
}

/** Bumped by every `show`, so a toggle mid-count stops the older count instead of racing it. */
let latestShow = 0;

/**
 * Show one range; resolves when its numbers have settled (or a newer `show` took over). With
 * motion, every number counts up from 0 (ease-out-expo) inside its locked final width.
 */
function show(stats: StatElement[], range: StatWindow, animate: boolean): Promise<void> {
  const run = ++latestShow;
  if (!animate) {
    stats.forEach(
      (stat) => (stat.element.textContent = formatStat(stat.key, stat.values[range] ?? 0)),
    );
    return Promise.resolve();
  }
  const finals = lockFinals(stats, range);
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number): void => {
      if (run !== latestShow) return resolve();
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      paint(stats, finals, progress);
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/**
 * Wire the 7d/30d toggle and hold the numbers at 0 for the intro. Returns the intro's count-up:
 * it waits until the strip is in view, then resolves when the count settles (at once if the
 * visitor already picked a range, or with reduced motion).
 */
export function initStats(): () => Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-stats]');
  if (!root) return () => Promise.resolve();
  const stats = readStats(root);
  const label = root.querySelector<HTMLElement>('[data-range-label]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-range]')];
  const animate = !prefersReducedMotion();
  let picked = false;

  if (animate) paint(stats, lockFinals(stats, DEFAULT_STAT_WINDOW), 0);

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const range = button.dataset.range;
      if (!isStatWindow(range) || button.getAttribute('aria-pressed') === 'true') return;
      picked = true;
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      if (label) label.textContent = button.dataset.label ?? '';
      void show(stats, range, animate);
    }),
  );

  return () =>
    !animate || picked
      ? Promise.resolve()
      : new Promise((resolve) =>
          onceVisible(root, COUNT_UP_VISIBLE_THRESHOLD, () => {
            if (picked) return resolve();
            performance.mark('intro:stats-start');
            resolve(show(stats, DEFAULT_STAT_WINDOW, animate));
          }),
        );
}
