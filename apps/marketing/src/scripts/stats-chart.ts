import type { StatSeries, StatsSeries, StatWindow } from '@nomadware/site-stats';
import { bucketStartMs, isStatWindow, parseStatsSeries } from '@nomadware/site-stats';

import { centreChip, chipTop, nearestIndex, pointAt } from '../chart/trace-geometry';
import { STATS_CHART } from '../constants';
import {
  formatAgentTime,
  formatBucketRange,
  formatCount,
  formatFixedIn,
  formatIssuesCaught,
  formatPrsMerged,
} from '../format/format-activity';
import type { TraceDraw } from './trace-draw';
import { pulseMarkers } from './marker-pulse';
import { drawPlot, runTraceDraw } from './trace-draw';

const HOUR_MS = 3_600_000;

/**
 * The chart as stats-card.ts sees it: its series (null without a chart), a range's first draw
 * (`onReach` gets the pen's share of the width every frame; without a chart, the same clock with
 * nothing drawn), its markers' pulse and hiding the tooltip (on a range toggle).
 */
export interface StatsChart {
  series: StatsSeries | null;
  draw: (range: StatWindow, onReach: (reach: number) => void) => TraceDraw;
  /** Pulse a drawn range's caught markers, all together (it shows again on a toggle). */
  pulse: (range: StatWindow) => void;
  reset: () => void;
}

const noop = (): void => undefined;
const drawNothing = (onReach: (reach: number) => void): TraceDraw =>
  runTraceDraw(null, onReach, () => undefined);

function readSeries(chart: HTMLElement): { series: StatsSeries; generatedAtMs: number } | null {
  const series = parseStatsSeries(JSON.parse(chart.dataset.series ?? 'null'));
  const generatedAtMs = Date.parse(chart.dataset.generatedAt ?? '');
  return series && !Number.isNaN(generatedAtMs) ? { series, generatedAtMs } : null;
}

const currentPlot = (chart: HTMLElement): HTMLElement | null =>
  chart.querySelector<HTMLElement>('.plot[data-current]');

const setTip = (plot: HTMLElement, name: string, text: string): void => {
  const slot = plot.querySelector<HTMLElement>(`[data-tip="${name}"]`);
  if (slot) slot.textContent = text;
};

/**
 * Fill the tooltip with bucket `index`: when, its agent work and merged PRs, their lines, and the
 * issues caught with their kinds and time to fix (each only if known).
 */
function describe(
  plot: HTMLElement,
  series: StatSeries,
  generatedAtMs: number,
  index: number,
): void {
  const count = series.agentMinutes.length;
  const startMs = bucketStartMs(generatedAtMs, series.bucketHours, index, count);
  setTip(plot, 'when', formatBucketRange(startMs, startMs + series.bucketHours * HOUR_MS));
  setTip(
    plot,
    'work',
    `${formatAgentTime(series.agentMinutes[index] ?? 0)} agent work · ${formatPrsMerged(series.prsMerged[index] ?? 0)}`,
  );
  const added = series.linesAdded[index] ?? 0;
  const deleted = series.linesDeleted[index] ?? 0;
  setTip(plot, 'added', `+${formatCount(added)}`);
  setTip(plot, 'deleted', `−${formatCount(deleted)}`);
  // A bucket with no merged lines gets no "+0 −0 lines" row.
  plot
    .querySelector<HTMLElement>('[data-tip-lines]')
    ?.toggleAttribute('hidden', added + deleted === 0);
  const caught = series.caught[index] ?? 0;
  const fixMinutes = series.caughtFixMinutes[index] ?? null;
  setTip(plot, 'caught', formatIssuesCaught(caught, series.caughtCategories[index] ?? null));
  setTip(plot, 'fixed', fixMinutes === null ? '' : formatFixedIn(fixMinutes));
  plot.querySelector('[data-tip-issues]')?.toggleAttribute('hidden', caught === 0);
  plot.querySelector('[data-tip="fixed"]')?.toggleAttribute('hidden', fixMinutes === null);
}

/** Snap to the bucket nearest the pointer: guide, dot, and the tooltip centred over the guide. */
function snap(plot: HTMLElement, series: StatSeries, generatedAtMs: number, clientX: number): void {
  const plotBox = plot.getBoundingClientRect();
  const values = series.agentMinutes;
  const index = nearestIndex((clientX - plotBox.left) / plotBox.width, values.length);
  const point = pointAt(values, index);
  describe(plot, series, generatedAtMs, index);
  plot.style.setProperty('--hover-x', `${point.x * 100}%`);
  plot.style.setProperty('--hover-y', `${point.y * 100}%`);
  plot.toggleAttribute('data-hover', true);

  // Measured once data-hover shows it: its size depends on the text. Centred on the guide, above
  // the plot, free to overhang the card, never the screen.
  const tip = plot.querySelector<HTMLElement>('.tip');
  if (!tip) return;
  const { tipGapPx, tipViewportMarginPx } = STATS_CHART;
  const left = centreChip(point.x * plotBox.width, tip.offsetWidth, {
    left: tipViewportMarginPx - plotBox.left,
    right: document.documentElement.clientWidth - tipViewportMarginPx - plotBox.left,
  });
  plot.style.setProperty('--tip-left', `${left}px`);
  const top = chipTop(tip.offsetHeight, plotBox, tipGapPx, tipViewportMarginPx);
  plot.style.setProperty('--tip-top', `${top}px`);
}

/**
 * Wire the chart: each range's first draw (trace-draw.ts) and its tooltip: a mouse snaps it to the
 * nearest bucket and leaving hides it; a touch (tap or horizontal drag) does the same and keeps it
 * until a tap elsewhere or a scroll takes over.
 */
export function initStatsChart(root: HTMLElement): StatsChart {
  const chart = root.querySelector<HTMLElement>('[data-stats-chart]');
  const data = chart ? readSeries(chart) : null;
  if (!chart || !data) {
    return { series: null, draw: (_, onReach) => drawNothing(onReach), pulse: noop, reset: noop };
  }
  const { series, generatedAtMs } = data;

  const reset = (): void =>
    chart
      .querySelectorAll('.plot[data-hover]')
      .forEach((plot) => plot.removeAttribute('data-hover'));

  const follow = (event: PointerEvent): void => {
    const plot = currentPlot(chart);
    const range = plot?.dataset.rangeLabel;
    if (plot && isStatWindow(range)) snap(plot, series[range], generatedAtMs, event.clientX);
  };

  const plotOf = (range: StatWindow): HTMLElement | null =>
    chart.querySelector<HTMLElement>(`.plot[data-range-label="${range}"]`);
  const draw = (range: StatWindow, onReach: (reach: number) => void): TraceDraw => {
    const plot = plotOf(range);
    return plot ? drawPlot(plot, onReach) : drawNothing(onReach);
  };
  const pulse = (range: StatWindow): void =>
    pulseMarkers([...(plotOf(range)?.querySelectorAll<HTMLElement>('[data-catch]') ?? [])]);

  chart.addEventListener('pointerdown', follow);
  chart.addEventListener('pointermove', (event) => {
    // A touch moves only while pressed; a mouse hovers.
    if (event.pointerType === 'mouse' || event.buttons > 0) follow(event);
  });
  chart.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') reset();
  });
  // The browser took the gesture over for a vertical scroll.
  chart.addEventListener('pointercancel', reset);
  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !chart.contains(event.target)) reset();
  });

  return { series, draw, pulse, reset };
}
