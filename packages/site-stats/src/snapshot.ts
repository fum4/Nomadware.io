// The stats snapshot contract: what the devbox publisher writes to R2 and the site reads. The one
// home for its shape — both sides import it from here, and both run it through parseStatsSnapshot.

import { isRecord } from './is-record.ts';
import type { StatsSeries } from './series.ts';
import { parseStatsSeries } from './series.ts';
import type { StatWindow } from './windows.ts';

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
  /** The activity chart's series (series.ts); absent from older snapshots or when malformed. */
  series?: StatsSeries;
}

export function isStatKey(value: string | undefined): value is StatKey {
  return STAT_KEYS.some((key) => key === value);
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

/**
 * A snapshot from untrusted JSON, or null when anything it needs is missing or malformed. The
 * series is optional: missing or malformed, it is left out and the snapshot still stands.
 */
export function parseStatsSnapshot(value: unknown): StatsSnapshot | null {
  if (!isRecord(value)) return null;
  const generatedAt = value['generatedAt'];
  const windows = value['windows'];
  if (!isRecord(windows)) return null;
  if (typeof generatedAt !== 'string' || Number.isNaN(Date.parse(generatedAt))) return null;
  const week = parseWindow(windows['7d']);
  const month = parseWindow(windows['30d']);
  if (!week || !month) return null;
  const series = parseStatsSeries(value['series']);
  return { generatedAt, windows: { '7d': week, '30d': month }, ...(series ? { series } : {}) };
}
