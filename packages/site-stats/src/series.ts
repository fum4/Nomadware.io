import { isRecord } from './is-record.ts';
import type { StatWindow } from './windows.ts';
import { STAT_WINDOW_DAYS } from './windows.ts';

// The snapshot's time series: what the site's activity chart draws. Optional in the snapshot (an
// older publisher leaves it out; the card then shows its numbers without the chart), and dropped
// as a whole when malformed — a chart bug never takes the numbers down with it.

const HOUR_MS = 3_600_000;
const HOURS_PER_DAY = 24;

/** Hours per chart bucket, by window: 7d → 84 points, 30d → 120. */
export const SERIES_BUCKET_HOURS: Readonly<Record<StatWindow, number>> = { '7d': 2, '30d': 6 };

/**
 * One window's series, oldest first. Buckets are aligned to UTC multiples of `bucketHours` since
 * the epoch, and the last one is the bucket `generatedAt` falls in (still filling): see
 * `bucketStartMs`. Every array has one entry per bucket.
 */
export interface StatSeries {
  bucketHours: number;
  /** Agent-minutes of activity per bucket (parallel sessions add up: can exceed the bucket). */
  agentMinutes: number[];
  /** PRs merged per bucket. */
  prsMerged: number[];
  /** Lines added / deleted by the PRs merged in the bucket (same exclusions as the window's). */
  linesAdded: number[];
  linesDeleted: number[];
}

export type StatsSeries = Record<StatWindow, StatSeries>;

/** Buckets in a window: the window's hours over the bucket size. */
export const bucketCount = (window: StatWindow): number =>
  (STAT_WINDOW_DAYS[window] * HOURS_PER_DAY) / SERIES_BUCKET_HOURS[window];

/** Where bucket `index` of a series of `count` buckets starts, the last one holding `generatedAtMs`. */
export function bucketStartMs(
  generatedAtMs: number,
  bucketHours: number,
  index: number,
  count: number,
): number {
  const bucketMs = bucketHours * HOUR_MS;
  return (Math.floor(generatedAtMs / bucketMs) - (count - 1 - index)) * bucketMs;
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

function parseCounts(value: unknown, length: number): number[] | null {
  return Array.isArray(value) && value.length === length && value.every(isCount) ? value : null;
}

function parseWindowSeries(value: unknown, window: StatWindow): StatSeries | null {
  if (!isRecord(value)) return null;
  if (value['bucketHours'] !== SERIES_BUCKET_HOURS[window]) return null;
  const count = bucketCount(window);
  const agentMinutes = parseCounts(value['agentMinutes'], count);
  const prsMerged = parseCounts(value['prsMerged'], count);
  const linesAdded = parseCounts(value['linesAdded'], count);
  const linesDeleted = parseCounts(value['linesDeleted'], count);
  if (!agentMinutes || !prsMerged || !linesAdded || !linesDeleted) return null;
  const bucketHours = SERIES_BUCKET_HOURS[window];
  return { bucketHours, agentMinutes, prsMerged, linesAdded, linesDeleted };
}

/** Every window's series from untrusted JSON, or null when absent or anything is malformed. */
export function parseStatsSeries(value: unknown): StatsSeries | null {
  if (!isRecord(value)) return null;
  const week = parseWindowSeries(value['7d'], '7d');
  const month = parseWindowSeries(value['30d'], '30d');
  return week && month ? { '7d': week, '30d': month } : null;
}
