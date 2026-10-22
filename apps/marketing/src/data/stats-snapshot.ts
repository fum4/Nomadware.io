// The stats strip's data, shaped like the snapshot JSON live stats will publish. Placeholder
// numbers until then, hand-computed from the devbox (method per field in apps/marketing/README.md).

export const STAT_WINDOWS = ['7d', '30d'] as const;
export type StatWindow = (typeof STAT_WINDOWS)[number];

export interface StatWindowValues {
  prs: number;
  runs: number;
  agentHours: number;
  checks: number;
  caught: number;
  actions: number;
  linesAdded: number;
  linesDeleted: number;
  repos: number;
}

export type StatKey = keyof StatWindowValues;

export const STAT_KEYS: readonly StatKey[] = [
  'prs',
  'runs',
  'agentHours',
  'checks',
  'caught',
  'actions',
  'linesAdded',
  'linesDeleted',
  'repos',
];

export function isStatKey(value: string | undefined): value is StatKey {
  return STAT_KEYS.some((key) => key === value);
}

export function isStatWindow(value: string | undefined): value is StatWindow {
  return STAT_WINDOWS.some((window) => window === value);
}

export interface StatsSnapshot {
  /** ISO 8601 — when these numbers were computed ("updated Xm ago"). */
  generatedAt: string;
  windows: Record<StatWindow, StatWindowValues>;
}

export const STATS_SNAPSHOT: StatsSnapshot = {
  generatedAt: '2026-10-22T19:23:03Z',
  windows: {
    '7d': {
      prs: 174,
      runs: 253,
      agentHours: 83,
      checks: 538,
      caught: 37,
      actions: 14_711,
      linesAdded: 111_704,
      linesDeleted: 18_661,
      repos: 9,
    },
    '30d': {
      prs: 530,
      runs: 1_532,
      agentHours: 373,
      checks: 754,
      caught: 56,
      actions: 94_596,
      linesAdded: 593_000,
      linesDeleted: 83_000,
      repos: 10,
    },
  },
};

export const DEFAULT_STAT_WINDOW: StatWindow = '7d';
