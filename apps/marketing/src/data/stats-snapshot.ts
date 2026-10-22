import type { StatsSnapshot, StatWindow } from '@nomadware/site-stats';

// The bundled fallback: what the stats strip shows when the live snapshot (R2, written by
// tools/stats-publisher) can't be read. Its age shows on the page ("updated Xd ago", stale dot),
// so refreshing it is optional: `mise run stats:compute` prints a current one.

export const BUNDLED_STATS_SNAPSHOT: StatsSnapshot = {
  generatedAt: '2026-10-22T20:52:23Z',
  windows: {
    '7d': {
      prs: 194,
      runs: 263,
      agentHours: 85,
      checks: 513,
      caught: 31,
      actions: 15_669,
      linesAdded: 76_541,
      linesDeleted: 14_925,
      repos: 9,
    },
    '30d': {
      prs: 544,
      runs: 1_553,
      agentHours: 378,
      checks: 770,
      caught: 56,
      actions: 95_691,
      linesAdded: 426_239,
      linesDeleted: 80_495,
      repos: 11,
    },
  },
};

/** The range the strip opens on. */
export const DEFAULT_STAT_WINDOW: StatWindow = '7d';
