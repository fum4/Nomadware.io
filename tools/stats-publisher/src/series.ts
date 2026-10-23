import type { StatDay, StatSeries, StatsSeries, StatWindow } from '@nomadware/site-stats';
import {
  bucketCount,
  bucketStartMs,
  SERIES_BUCKET_HOURS,
  STAT_WINDOW_DAYS,
} from '@nomadware/site-stats';

import { DAY_MS, HOUR_MS, MINUTE_MS } from './constants.ts';
import type { State } from './state.ts';

// The store → the activity chart's series (@nomadware/site-stats § series.ts). Aggregates only,
// like aggregate.ts: per bucket and per day, never per file or per repo.

/** Index of the slot `atMs` falls in, for slots of `slotMs` ending with the one at `lastStartMs`. */
function slotIndex(
  atMs: number,
  lastStartMs: number,
  slotMs: number,
  count: number,
): number | null {
  const fromLast = Math.floor((atMs - lastStartMs) / slotMs);
  const index = count - 1 + fromLast;
  return index >= 0 && index < count ? index : null;
}

function windowSeries(state: State, nowMs: number, window: StatWindow): StatSeries {
  const bucketHours = SERIES_BUCKET_HOURS[window];
  const bucketMs = bucketHours * HOUR_MS;
  const buckets = bucketCount(window);
  const lastBucketMs = bucketStartMs(nowMs, bucketHours, buckets - 1, buckets);
  const activeMs = Array.from({ length: buckets }, () => 0);
  const prsMerged = Array.from({ length: buckets }, () => 0);

  for (const file of Object.values(state.transcripts)) {
    for (const [minute, [ms]] of Object.entries(file.minutes)) {
      const index = slotIndex(Number(minute) * MINUTE_MS, lastBucketMs, bucketMs, buckets);
      if (index !== null) activeMs[index] = (activeMs[index] ?? 0) + ms;
    }
  }

  const dayCount = STAT_WINDOW_DAYS[window];
  const lastDayMs = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const days: StatDay[] = Array.from({ length: dayCount }, (_, index) => ({
    date: new Date(lastDayMs - (dayCount - 1 - index) * DAY_MS).toISOString().slice(0, 10),
    linesAdded: 0,
    linesDeleted: 0,
  }));
  // A PR's lines count on its merge day (UTC), its PR in its merge bucket.
  for (const pr of Object.values(state.github.prs)) {
    const bucket = slotIndex(pr.mergedAtMs, lastBucketMs, bucketMs, buckets);
    if (bucket !== null) prsMerged[bucket] = (prsMerged[bucket] ?? 0) + 1;
    const dayIndex = slotIndex(pr.mergedAtMs, lastDayMs, DAY_MS, dayCount);
    const day = dayIndex === null ? undefined : days[dayIndex];
    if (day) {
      day.linesAdded += pr.linesAdded;
      day.linesDeleted += pr.linesDeleted;
    }
  }

  return {
    bucketHours,
    agentMinutes: activeMs.map((ms) => Math.round(ms / MINUTE_MS)),
    prsMerged,
    days,
  };
}

export function buildSeries(state: State, nowMs: number): StatsSeries {
  return { '7d': windowSeries(state, nowMs, '7d'), '30d': windowSeries(state, nowMs, '30d') };
}
