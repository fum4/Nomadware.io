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

/**
 * Show one range. With motion, every number counts up from 0 (ease-out-expo); its final width is
 * locked first so neighbours (the "−18.7k" after "+112k") never move while digits change.
 */
function show(stats: StatElement[], range: StatWindow, animate: boolean): void {
  const finals = stats.map((stat) => stat.values[range] ?? 0);
  stats.forEach((stat, index) => {
    stat.element.style.minWidth = '';
    stat.element.textContent = formatStat(stat.key, finals[index] ?? 0);
  });
  if (!animate) return;
  stats.forEach((stat) => (stat.element.style.minWidth = `${stat.element.offsetWidth}px`));

  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
    stats.forEach((stat, index) => {
      const final = finals[index] ?? 0;
      stat.element.textContent = formatStat(stat.key, final * easeOutExpo(progress), final);
    });
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initStats(): void {
  const root = document.querySelector<HTMLElement>('[data-stats]');
  if (!root) return;
  const stats = readStats(root);
  const label = root.querySelector<HTMLElement>('[data-range-label]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-range]')];
  const animate = !prefersReducedMotion();

  onceVisible(root, COUNT_UP_VISIBLE_THRESHOLD, () => show(stats, DEFAULT_STAT_WINDOW, animate));

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const range = button.dataset.range;
      if (!isStatWindow(range) || button.getAttribute('aria-pressed') === 'true') return;
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      if (label) label.textContent = button.dataset.label ?? '';
      show(stats, range, animate);
    }),
  );
}
