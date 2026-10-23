// The activity chart's words: what the hover tooltip prints. Times are the visitor's own zone
// unless `timeZone` says (tests pin one).
import type { CaughtGate } from '@nomadware/site-stats';
import { CAUGHT_CATEGORIES, CAUGHT_GATES } from '@nomadware/site-stats';

const LOCALE = 'en-GB';
const MINUTES_PER_HOUR = 60;

/** "1h 40m", "2h", "40m". */
export function formatAgentTime(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = Math.round(minutes % MINUTES_PER_HOUR);
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "Wed 21 Oct · 14:00–16:00": the day the bucket starts, and its hours. */
export function formatBucketRange(startMs: number, endMs: number, timeZone?: string): string {
  const day = new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  });
  const time = new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  return `${day.format(startMs).replace(',', '')} · ${time.format(startMs)}–${time.format(endMs)}`;
}

/** "1,240" — the site's grouping (format-stat.ts prints full numbers the same way). */
export const formatCount = (value: number): string => Math.round(value).toLocaleString('en-US');

/** "2 PRs merged", "1 PR merged". */
export const formatPrsMerged = (count: number): string =>
  `${formatCount(count)} ${count === 1 ? 'PR' : 'PRs'} merged`;

const GATE_WORDS: Readonly<Record<CaughtGate, string>> = { push: 'at push', merge: 'at merge' };

/** Counts named by `names` ("3 tests"), largest first, ties in `names` order; empty ones dropped. */
const namedCounts = (names: readonly string[], counts: readonly number[] | null): string[] =>
  names
    .map((name, index) => ({ name, count: counts?.[index] ?? 0 }))
    .filter((entry) => entry.count > 0)
    .toSorted((a, b) => b.count - a.count)
    .map((entry) => `${formatCount(entry.count)} ${entry.name}`);

/**
 * "1 issue caught · at push", "5 issues caught · 3 at push, 2 at merge": the gates that caught
 * them (CAUGHT_GATES counts), most first.
 */
export function formatIssuesCaught(count: number, byGate: readonly number[] | null): string {
  const issues = `${formatCount(count)} ${count === 1 ? 'issue' : 'issues'} caught`;
  const gates = CAUGHT_GATES.filter((_, index) => (byGate?.[index] ?? 0) > 0);
  const only = gates.length === 1 ? gates[0] : undefined;
  if (only) return `${issues} · ${GATE_WORDS[only]}`;
  const split = namedCounts(
    CAUGHT_GATES.map((gate) => GATE_WORDS[gate]),
    byGate,
  );
  return split.length === 0 ? issues : `${issues} · ${split.join(', ')}`;
}

/** "3 tests, 2 types": what they were (CAUGHT_CATEGORIES counts), most first; "" when unknown. */
export const formatCaughtKinds = (categories: readonly number[] | null): string =>
  namedCounts(CAUGHT_CATEGORIES, categories).join(', ');

/** "fixed in 1h 58m": in the chip's own durations (formatAgentTime). */
export const formatFixedIn = (minutes: number): string => `fixed in ${formatAgentTime(minutes)}`;
