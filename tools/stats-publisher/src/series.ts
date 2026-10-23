import type { StatSeries, StatsSeries, StatWindow } from '@nomadware/site-stats';
import { bucketCount, bucketStartMs, SERIES_BUCKET_HOURS } from '@nomadware/site-stats';

import { HOUR_MS, MINUTE_MS } from './constants.ts';
import type { State } from './state.ts';

// The store → the activity chart's series (@nomadware/site-stats § series.ts). Aggregates only,
// like aggregate.ts: per bucket, never per file or per repo.

const zeros = (count: number): number[] => Array.from({ length: count }, () => 0);

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

  const activeMs = zeros(buckets);
  for (const file of Object.values(state.transcripts)) {
    for (const [minute, [ms]] of Object.entries(file.minutes)) {
      const index = bucketOf(Number(minute) * MINUTE_MS);
      if (index !== null) activeMs[index] = (activeMs[index] ?? 0) + ms;
    }
  }

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
  };
}

export function buildSeries(state: State, nowMs: number): StatsSeries {
  return { '7d': windowSeries(state, nowMs, '7d'), '30d': windowSeries(state, nowMs, '30d') };
}
