import type { StatSeries, StatsSeries, StatWindow } from '@nomadware/site-stats';
import { bucketStartMs, isStatWindow, parseStatsSeries } from '@nomadware/site-stats';

import { centreChip, chipTop, nearestIndex, pointAt } from '../chart/trace-geometry';
import { STATS_CHART } from '../constants';
import {
  formatAgentTime,
  formatBucketRange,
  formatCaughtGates,
  formatCaughtKinds,
  formatCount,
  formatIssuesCaught,
  formatPrsMerged,
} from '../format/format-activity';
import type { TraceDraw } from './trace-draw';
import { createPulseQueue } from './marker-pulse';
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
  /** Pulse a drawn range's caught markers all at once (it shows again on a toggle). */
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
 * issues caught: by which gate, of what kind and how fast fixed (each only if known).
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
  // A bucket with no merged lines gets no "+0 −0" row.
  plot
    .querySelector<HTMLElement>('[data-tip-lines]')
    ?.toggleAttribute('hidden', added + deleted === 0);
  const caught = series.caught[index] ?? 0;
  const fixMinutes = series.caughtFixMinutes[index] ?? null;
  const kinds = formatCaughtKinds(series.caughtCategories[index] ?? null);
  const gates = formatCaughtGates(series.caughtByGate[index] ?? null);
  setTip(plot, 'caught', formatIssuesCaught(caught));
  setTip(plot, 'gates', gates === '' ? '' : ` · ${gates}`);
  setTip(plot, 'kinds', kinds);
  setTip(plot, 'fixed', fixMinutes === null ? '' : formatAgentTime(fixMinutes));
  plot.querySelector('[data-tip-issues]')?.toggleAttribute('hidden', caught === 0);
  plot.querySelector('[data-tip="kinds"]')?.toggleAttribute('hidden', kinds === '');
  plot.querySelector('[data-tip-fixed]')?.toggleAttribute('hidden', fixMinutes === null);
}

/** Snap to the bucket nearest the pointer: guide, dot, and the tooltip centred over the guide. */
/**
 * The hovered bucket's caught marker, if it has one, takes the green dot's place: it stays warm,
 * on top, pulsing (stats-chart.astro). Only a change of bucket touches the DOM, so the pulse
 * keeps its rhythm while the pointer moves within one.
 */
function hoverMarker(plot: HTMLElement, index: number): void {
  const marker = plot.querySelector<HTMLElement>(`[data-catch="${index}"]`);
  const current = plot.querySelector<HTMLElement>('[data-hovered]');
  if (current === marker) return;
  current?.removeAttribute('data-hovered');
  marker?.setAttribute('data-hovered', '');
  plot.toggleAttribute('data-hover-catch', marker !== null);
}

function snap(plot: HTMLElement, series: StatSeries, generatedAtMs: number, clientX: number): void {
  const plotBox = plot.getBoundingClientRect();
  const values = series.agentMinutes;
  const index = nearestIndex((clientX - plotBox.left) / plotBox.width, values.length);
  const point = pointAt(values, index);
  describe(plot, series, generatedAtMs, index);
  plot.style.setProperty('--hover-x', `${point.x * 100}%`);
  plot.style.setProperty('--hover-y', `${point.y * 100}%`);
  plot.toggleAttribute('data-hover', true);
  hoverMarker(plot, index);

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

  const reset = (): void => {
    chart.querySelectorAll('.plot[data-hover]').forEach((plot) => {
      plot.removeAttribute('data-hover');
      plot.removeAttribute('data-hover-catch');
    });
    chart
      .querySelectorAll('[data-hovered]')
      .forEach((marker) => marker.removeAttribute('data-hovered'));
  };

  const follow = (event: PointerEvent): void => {
    const plot = currentPlot(chart);
    const range = plot?.dataset.rangeLabel;
    if (plot && isStatWindow(range)) snap(plot, series[range], generatedAtMs, event.clientX);
  };

  // One queue for the whole chart: a toggle drops the other range's waiting pulses.
  const pulses = createPulseQueue();
  const plotOf = (range: StatWindow): HTMLElement | null =>
    chart.querySelector<HTMLElement>(`.plot[data-range-label="${range}"]`);
  const draw = (range: StatWindow, onReach: (reach: number) => void): TraceDraw => {
    const plot = plotOf(range);
    pulses.cancel();
    return plot ? drawPlot(plot, pulses, onReach) : drawNothing(onReach);
  };
  const pulse = (range: StatWindow): void =>
    pulses.burst([...(plotOf(range)?.querySelectorAll<HTMLElement>('[data-catch]') ?? [])]);

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
