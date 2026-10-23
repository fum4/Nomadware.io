import { isRecord } from './is-record.ts';
import type { StatWindow } from './windows.ts';
import { STAT_WINDOW_DAYS } from './windows.ts';

// The snapshot's time series: what the site's activity chart draws. Optional in the snapshot (an
// older publisher leaves it out; the card then shows its numbers without the chart), and dropped
// as a whole when malformed — a chart bug never takes the numbers down with it.

const HOUR_MS = 3_600_000;
const HOURS_PER_DAY = 24;
const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Hours per chart bucket, by window: 7d → 84 points, 30d → 120. */
export const SERIES_BUCKET_HOURS: Readonly<Record<StatWindow, number>> = { '7d': 2, '30d': 6 };

/** Lines changed by the PRs merged on one UTC day (same exclusions as linesAdded/linesDeleted). */
export interface StatDay {
  /** UTC date, `YYYY-MM-DD`. */
  date: string;
  linesAdded: number;
  linesDeleted: number;
}

/**
 * One window's series, oldest first. Buckets are aligned to UTC multiples of `bucketHours` since
 * the epoch, and the last one is the bucket `generatedAt` falls in (still filling): see
 * `bucketStartMs`. Days are UTC days, the last one is `generatedAt`'s.
 */
export interface StatSeries {
  bucketHours: number;
  /** Agent-minutes of activity per bucket (parallel sessions add up: can exceed the bucket). */
  agentMinutes: number[];
  /** PRs merged per bucket. */
  prsMerged: number[];
  /** One entry per day of the window. */
  days: StatDay[];
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

/** `YYYY-MM-DD` naming a real day (a round trip through Date rejects 2026-02-30). */
const isUtcDate = (date: string): boolean =>
  UTC_DATE.test(date) &&
  !Number.isNaN(Date.parse(date)) &&
  new Date(date).toISOString().startsWith(date);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

function parseCounts(value: unknown, length: number): number[] | null {
  return Array.isArray(value) && value.length === length && value.every(isCount) ? value : null;
}

function parseDay(value: unknown): StatDay | null {
  if (!isRecord(value)) return null;
  const { date, linesAdded, linesDeleted } = value;
  if (typeof date !== 'string' || !isUtcDate(date)) return null;
  return isCount(linesAdded) && isCount(linesDeleted) ? { date, linesAdded, linesDeleted } : null;
}

function parseWindowSeries(value: unknown, window: StatWindow): StatSeries | null {
  if (!isRecord(value)) return null;
  if (value['bucketHours'] !== SERIES_BUCKET_HOURS[window]) return null;
  const agentMinutes = parseCounts(value['agentMinutes'], bucketCount(window));
  const prsMerged = parseCounts(value['prsMerged'], bucketCount(window));
  const rawDays = value['days'];
  if (!agentMinutes || !prsMerged || !Array.isArray(rawDays)) return null;
  if (rawDays.length !== STAT_WINDOW_DAYS[window]) return null;
  const days = rawDays.map(parseDay);
  if (!days.every((day): day is StatDay => day !== null)) return null;
  return { bucketHours: SERIES_BUCKET_HOURS[window], agentMinutes, prsMerged, days };
}

/** Every window's series from untrusted JSON, or null when absent or anything is malformed. */
export function parseStatsSeries(value: unknown): StatsSeries | null {
  if (!isRecord(value)) return null;
  const week = parseWindowSeries(value['7d'], '7d');
  const month = parseWindowSeries(value['30d'], '30d');
  return week && month ? { '7d': week, '30d': month } : null;
}
