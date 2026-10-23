import type { StatsSnapshot } from '@nomadware/site-stats';
import { parseStatsSnapshot } from '@nomadware/site-stats';

import BUNDLED_JSON from './stats-snapshot.json';

// The bundled fallback: what the stats card shows when the live snapshot (R2, written by
// tools/stats-publisher) can't be read, and what local dev shows (no read credential there). Its
// age shows on the page ("updated Xd ago", stale dot), so refreshing it is optional: paste the
// output of `mise run stats:compute -- --dry-run` into stats-snapshot.json. Server-only: client
// scripts never import this module (it would ship the JSON).

function bundled(): StatsSnapshot {
  const snapshot = parseStatsSnapshot(BUNDLED_JSON);
  // A broken bundle fails the build and the tests, never a visitor's request.
  if (!snapshot) throw new Error('stats-snapshot.json fails the @nomadware/site-stats contract');
  return snapshot;
}

export const BUNDLED_STATS_SNAPSHOT: StatsSnapshot = bundled();
