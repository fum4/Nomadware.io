import { isRecord } from './is-record.ts';
import type { StatWindow } from './windows.ts';
import { STAT_WINDOW_DAYS } from './windows.ts';

// The snapshot's time series: what the site's activity chart draws. Optional in the snapshot (an
// older publisher leaves it out; the card then shows its numbers without the chart), and dropped
// as a whole when malformed or incomplete (a series from before runs/actions/checks/caught,
// caughtFixMinutes and caughtCategories counts as incomplete) — a chart bug never takes the numbers down with it.

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
  /** Agent runs, each counted once: in the bucket of its first activity inside the series. */
  runs: number[];
  /** tool_use blocks per bucket (the window's `actions`). */
  actions: number[];
  /** Gate runs that finished / failed per bucket (the window's `checks` / `caught`). */
  checks: number[];
  caught: number[];
  /**
   * How long the bucket's caught issues took to fix, in minutes: the longest among them, from its
   * gate's first failure in a row to that gate's next pass. null when the bucket caught nothing
   * or any of its issues isn't fixed yet.
   */
  caughtFixMinutes: (number | null)[];
  /**
   * What the bucket's gates caught: per entry of CAUGHT_CATEGORIES, how many of its issues were
   * of that kind. null when none of them says (it caught nothing, or only before the gates
   * started recording the failing task); otherwise its counts may sum to less than `caught`.
   */
  caughtCategories: (number[] | null)[];
}

/** What a caught issue was, by the task that failed: the order of every `caughtCategories` entry. */
export const CAUGHT_CATEGORIES = ['format', 'lint', 'types', 'tests', 'build', 'other'] as const;

export type CaughtCategory = (typeof CAUGHT_CATEGORIES)[number];

/** The per-bucket counts of a series: one entry per bucket, each a non-negative integer. */
export type SeriesCounts = Exclude<
  keyof StatSeries,
  'bucketHours' | 'caughtFixMinutes' | 'caughtCategories'
>;

export const SERIES_COUNTS: readonly SeriesCounts[] = [
  'agentMinutes',
  'prsMerged',
  'linesAdded',
  'linesDeleted',
  'runs',
  'actions',
  'checks',
  'caught',
];

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

const isCountOrNull = (value: unknown): value is number | null => value === null || isCount(value);

function parseNullableCounts(value: unknown, length: number): (number | null)[] | null {
  return Array.isArray(value) && value.length === length && value.every(isCountOrNull)
    ? value
    : null;
}

const isCategoryCountsOrNull = (value: unknown): value is number[] | null =>
  value === null ||
  (Array.isArray(value) && value.length === CAUGHT_CATEGORIES.length && value.every(isCount));

function parseCategories(value: unknown, length: number): (number[] | null)[] | null {
  return Array.isArray(value) && value.length === length && value.every(isCategoryCountsOrNull)
    ? value
    : null;
}

function parseWindowSeries(value: unknown, window: StatWindow): StatSeries | null {
  if (!isRecord(value)) return null;
  const bucketHours = SERIES_BUCKET_HOURS[window];
  if (value['bucketHours'] !== bucketHours) return null;
  const count = bucketCount(window);
  // An empty array marks a missing or malformed one: a valid one has `count` entries.
  const counts = (key: SeriesCounts): number[] => parseCounts(value[key], count) ?? [];
  const series: StatSeries = {
    bucketHours,
    agentMinutes: counts('agentMinutes'),
    prsMerged: counts('prsMerged'),
    linesAdded: counts('linesAdded'),
    linesDeleted: counts('linesDeleted'),
    runs: counts('runs'),
    actions: counts('actions'),
    checks: counts('checks'),
    caught: counts('caught'),
    caughtFixMinutes: parseNullableCounts(value['caughtFixMinutes'], count) ?? [],
    caughtCategories: parseCategories(value['caughtCategories'], count) ?? [],
  };
  const complete = [
    ...SERIES_COUNTS,
    'caughtFixMinutes' as const,
    'caughtCategories' as const,
  ].every((key) => series[key].length === count);
  return complete ? series : null;
}

/** Every window's series from untrusted JSON, or null when absent or anything is malformed. */
export function parseStatsSeries(value: unknown): StatsSeries | null {
  if (!isRecord(value)) return null;
  const week = parseWindowSeries(value['7d'], '7d');
  const month = parseWindowSeries(value['30d'], '30d');
  return week && month ? { '7d': week, '30d': month } : null;
}
