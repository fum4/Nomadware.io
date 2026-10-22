import type { StatsSnapshot } from '@nomadware/site-stats';
import { getStatsObject, parseStatsSnapshot } from '@nomadware/site-stats';

import { STATS_READ_CREDENTIALS } from '../config/stats-source';
import { STATS_FETCH_TIMEOUT_MS } from '../constants';
import { logEvent } from '../log/log-event';
import { BUNDLED_STATS_SNAPSHOT } from './stats-snapshot';

/** Where the numbers came from: rendered as `data-stats-source` so a fallback is visible in the HTML. */
export type StatsSource = 'live' | 'bundled:no-credentials' | 'bundled:fetch-failed';

export interface LoadedStats {
  snapshot: StatsSnapshot;
  source: StatsSource;
}

/** The live snapshot from R2, or the bundled one when it can't be read in time or fails the contract. */
export async function loadStats(): Promise<LoadedStats> {
  if (!STATS_READ_CREDENTIALS) {
    return { snapshot: BUNDLED_STATS_SNAPSHOT, source: 'bundled:no-credentials' };
  }
  try {
    const response = await getStatsObject(
      STATS_READ_CREDENTIALS,
      AbortSignal.timeout(STATS_FETCH_TIMEOUT_MS),
    );
    const snapshot = response.ok ? parseStatsSnapshot(await response.json()) : null;
    if (snapshot) return { snapshot, source: 'live' };
    logEvent('warn', 'stats_fetch_failed', { status: response.status, valid: false });
  } catch (error) {
    // network error, timeout or invalid JSON: same fallback as a bad response
    logEvent('warn', 'stats_fetch_failed', {
      error: error instanceof Error ? error.name : 'unknown',
    });
  }
  return { snapshot: BUNDLED_STATS_SNAPSHOT, source: 'bundled:fetch-failed' };
}
