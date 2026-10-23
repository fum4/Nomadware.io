import type { StatWindow } from '@nomadware/site-stats';

// TEMPORARY (NWARE-82), stats variants a/d only: per-window series computed on the devbox from the
// publisher's local store into stats-series.preview.json (gitignored, never deployed). Absent →
// undefined, and the variants draw without a chart. Shipping a chart means adding these series to
// the published snapshot (packages/site-stats) instead.

export interface StatsSeries {
  /** Merged PRs per UTC day, oldest first: 7 or 30 points. */
  prsPerDay: Record<StatWindow, number[]>;
  /** Agent-minutes of activity per bucket, oldest first (7d: 2h buckets, 30d: 6h). */
  agentMinutes: Record<StatWindow, number[]>;
}

const files = import.meta.glob<StatsSeries>('./stats-series.preview.json', {
  eager: true,
  import: 'default',
});

export const STATS_SERIES: StatsSeries | undefined = Object.values(files)[0];
