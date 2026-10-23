import { MINUTE_MS } from './constants.ts';
import type { JournalState } from './state.ts';

// How long a caught issue took to fix. Per gate unit (one worktree's pre-push or pre-merge), the
// failures up to its next pass are one episode; each failure in it was fixed when that pass came,
// counted from the episode's first failure. A unit with no pass since (still failing, or its
// worktree gone) leaves its episode unfixed. Per unit only: a worktree's gates are the identity
// that survives in the journal (the repo isn't in the unit's name).

/** Per entry of `journal.failed`, its time to fix in whole minutes (at least 1), or null if unfixed. */
export function fixMinutes(journal: JournalState): (number | null)[] {
  const fixes: (number | null)[] = journal.failed.map(() => null);
  const timeline = [
    ...journal.failed.map((run, index) => ({ ...run, failure: index })),
    ...journal.passed.map((run) => ({ ...run, failure: null })),
  ].toSorted((a, b) => a.atMs - b.atMs);
  /** Per unit, its open episode: when it started and the failures in it. */
  const open = new Map<string, { startMs: number; failures: number[] }>();
  for (const { atMs, unit, failure } of timeline) {
    const episode = open.get(unit);
    if (failure !== null) {
      if (episode) episode.failures.push(failure);
      else open.set(unit, { startMs: atMs, failures: [failure] });
    } else if (episode) {
      const minutes = Math.max(1, Math.round((atMs - episode.startMs) / MINUTE_MS));
      episode.failures.forEach((index) => (fixes[index] = minutes));
      open.delete(unit);
    }
  }
  return fixes;
}
