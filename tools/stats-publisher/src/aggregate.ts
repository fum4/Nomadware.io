import type { StatsSnapshot, StatWindow, StatWindowValues } from '@nomadware/site-stats';
import { STAT_WINDOW_DAYS } from '@nomadware/site-stats';

import { DAY_MS, HOUR_MS, MINUTE_MS } from './constants.ts';
import { buildSeries } from './series.ts';
import type { State } from './state.ts';

// The store → the published snapshot: rolling windows ending now. Aggregates only, by design —
// nothing below copies a name (repo, session, unit) into the result.

function windowValues(state: State, cutoffMs: number): StatWindowValues {
  const cutoffMinute = Math.floor(cutoffMs / MINUTE_MS);
  let runs = 0;
  let activeMs = 0;
  let actions = 0;
  for (const file of Object.values(state.transcripts)) {
    let active = false;
    for (const [key, [ms, toolUses]] of Object.entries(file.minutes)) {
      if (Number(key) < cutoffMinute) continue;
      active = true;
      activeMs += ms;
      actions += toolUses;
    }
    if (active) runs += 1;
  }

  let prs = 0;
  let linesAdded = 0;
  let linesDeleted = 0;
  const repos = new Set<string>();
  for (const pr of Object.values(state.github.prs)) {
    if (pr.mergedAtMs < cutoffMs) continue;
    prs += 1;
    linesAdded += pr.linesAdded;
    linesDeleted += pr.linesDeleted;
    repos.add(pr.repo);
  }

  return {
    prs,
    runs,
    agentHours: Math.round(activeMs / HOUR_MS),
    checks: state.journal.checksMs.filter((atMs) => atMs >= cutoffMs).length,
    caught: state.journal.failed.filter((run) => run.atMs >= cutoffMs).length,
    actions,
    linesAdded,
    linesDeleted,
    repos: repos.size,
  };
}

export function buildSnapshot(state: State, nowMs: number): StatsSnapshot {
  const values = (window: StatWindow): StatWindowValues =>
    windowValues(state, nowMs - STAT_WINDOW_DAYS[window] * DAY_MS);
  return {
    generatedAt: new Date(nowMs).toISOString(),
    windows: { '7d': values('7d'), '30d': values('30d') },
    series: buildSeries(state, nowMs),
  };
}
