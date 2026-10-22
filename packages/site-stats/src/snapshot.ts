// The stats snapshot contract: what the devbox publisher writes to R2 and the site reads. The one
// home for its shape — both sides import it from here, and both run it through parseStatsSnapshot.

export const STAT_WINDOWS = ['7d', '30d'] as const;
export type StatWindow = (typeof STAT_WINDOWS)[number];

/** Window length in days, by window. */
export const STAT_WINDOW_DAYS: Readonly<Record<StatWindow, number>> = { '7d': 7, '30d': 30 };

export interface StatWindowValues {
  /** PRs authored by the owner, merged in the window, every repo (private included). */
  prs: number;
  /** Agent runs: main Claude sessions with activity, plus subagent runs. */
  runs: number;
  /** Sum of intra-session gaps under the idle cutoff, main sessions and subagents. */
  agentHours: number;
  /** pre-push / pre-merge gate runs that finished. */
  checks: number;
  /** Gate runs that failed: what the gates caught. */
  caught: number;
  /** tool_use blocks the agents issued. */
  actions: number;
  /** Lines added across merged PRs, lockfiles and generated files excluded. */
  linesAdded: number;
  linesDeleted: number;
  /** Distinct repos with a merged PR. */
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

export interface StatsSnapshot {
  /** ISO 8601 — when these numbers were computed ("updated Xm ago"). */
  generatedAt: string;
  windows: Record<StatWindow, StatWindowValues>;
}

export function isStatKey(value: string | undefined): value is StatKey {
  return STAT_KEYS.some((key) => key === value);
}

export function isStatWindow(value: string | undefined): value is StatWindow {
  return STAT_WINDOWS.some((window) => window === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseWindow(value: unknown): StatWindowValues | null {
  if (!isRecord(value)) return null;
  // NaN marks a missing or malformed count; one NaN rejects the window.
  const count = (key: StatKey): number => {
    const raw = value[key];
    return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : Number.NaN;
  };
  const values: StatWindowValues = {
    prs: count('prs'),
    runs: count('runs'),
    agentHours: count('agentHours'),
    checks: count('checks'),
    caught: count('caught'),
    actions: count('actions'),
    linesAdded: count('linesAdded'),
    linesDeleted: count('linesDeleted'),
    repos: count('repos'),
  };
  return STAT_KEYS.every((key) => !Number.isNaN(values[key])) ? values : null;
}

/** A snapshot from untrusted JSON, or null when anything is missing or malformed. */
export function parseStatsSnapshot(value: unknown): StatsSnapshot | null {
  if (!isRecord(value)) return null;
  const generatedAt = value['generatedAt'];
  const windows = value['windows'];
  if (!isRecord(windows)) return null;
  if (typeof generatedAt !== 'string' || Number.isNaN(Date.parse(generatedAt))) return null;
  const week = parseWindow(windows['7d']);
  const month = parseWindow(windows['30d']);
  return week && month ? { generatedAt, windows: { '7d': week, '30d': month } } : null;
}
