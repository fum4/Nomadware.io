import type { StatSeries, StatsSeries, StatWindow } from '@nomadware/site-stats';
import { bucketCount, bucketStartMs, SERIES_BUCKET_HOURS } from '@nomadware/site-stats';

import { HOUR_MS, MINUTE_MS } from './constants.ts';
import { fixMinutes } from './fix-times.ts';
import type { State } from './state.ts';

// The store → the activity chart's series (@nomadware/site-stats § series.ts). Aggregates only,
// like aggregate.ts: per bucket, never per file or per repo.

const zeros = (count: number): number[] => Array.from({ length: count }, () => 0);

/** Per bucket, the longest time to fix among its caught issues; null if none, or one is unfixed. */
function caughtFixMinutes(
  state: State,
  bucketOf: (atMs: number) => number | null,
  buckets: number,
): (number | null)[] {
  const longest: (number | null)[] = Array.from({ length: buckets }, () => null);
  const unfixed = new Set<number>();
  const fixes = fixMinutes(state.journal);
  state.journal.failed.forEach((run, failure) => {
    const index = bucketOf(run.atMs);
    if (index === null) return;
    const minutes = fixes[failure] ?? null;
    if (minutes === null) unfixed.add(index);
    else longest[index] = Math.max(longest[index] ?? 0, minutes);
  });
  return longest.map((minutes, index) => (unfixed.has(index) ? null : minutes));
}

function windowSeries(state: State, nowMs: number, window: StatWindow): StatSeries {
  const bucketHours = SERIES_BUCKET_HOURS[window];
  const bucketMs = bucketHours * HOUR_MS;
  const buckets = bucketCount(window);
  const firstBucketMs = bucketStartMs(nowMs, bucketHours, 0, buckets);
  /** The bucket `atMs` falls in, or null outside the series. */
  const bucketOf = (atMs: number): number | null => {
    const index = Math.floor((atMs - firstBucketMs) / bucketMs);
    return index >= 0 && index < buckets ? index : null;
  };

  // Per minute: its active time and tool calls; per transcript, a run in its first active bucket.
  const activeMs = zeros(buckets);
  const actions = zeros(buckets);
  const runs = zeros(buckets);
  for (const file of Object.values(state.transcripts)) {
    let firstIndex: number | null = null;
    for (const [minute, [ms, toolUses]] of Object.entries(file.minutes)) {
      const index = bucketOf(Number(minute) * MINUTE_MS);
      if (index === null) continue;
      activeMs[index] = (activeMs[index] ?? 0) + ms;
      actions[index] = (actions[index] ?? 0) + toolUses;
      if (firstIndex === null || index < firstIndex) firstIndex = index;
    }
    if (firstIndex !== null) runs[firstIndex] = (runs[firstIndex] ?? 0) + 1;
  }

  /** How many of `timesMs` fall in each bucket. */
  const perBucket = (timesMs: readonly number[]): number[] => {
    const counts = zeros(buckets);
    for (const atMs of timesMs) {
      const index = bucketOf(atMs);
      if (index !== null) counts[index] = (counts[index] ?? 0) + 1;
    }
    return counts;
  };

  // A PR and its lines count in the bucket it merged in.
  const prsMerged = zeros(buckets);
  const linesAdded = zeros(buckets);
  const linesDeleted = zeros(buckets);
  for (const pr of Object.values(state.github.prs)) {
    const index = bucketOf(pr.mergedAtMs);
    if (index === null) continue;
    prsMerged[index] = (prsMerged[index] ?? 0) + 1;
    linesAdded[index] = (linesAdded[index] ?? 0) + pr.linesAdded;
    linesDeleted[index] = (linesDeleted[index] ?? 0) + pr.linesDeleted;
  }

  return {
    bucketHours,
    agentMinutes: activeMs.map((ms) => Math.round(ms / MINUTE_MS)),
    prsMerged,
    linesAdded,
    linesDeleted,
    runs,
    actions,
    checks: perBucket(state.journal.checksMs),
    caught: perBucket(state.journal.failed.map((run) => run.atMs)),
    caughtFixMinutes: caughtFixMinutes(state, bucketOf, buckets),
  };
}

export function buildSeries(state: State, nowMs: number): StatsSeries {
  return { '7d': windowSeries(state, nowMs, '7d'), '30d': windowSeries(state, nowMs, '30d') };
}
