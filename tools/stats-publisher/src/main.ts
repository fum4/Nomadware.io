import { parseStatsSnapshot, putStatsObject } from '@nomadware/site-stats';

import { buildSnapshot } from './aggregate.ts';
import { PATHS, readPublishCredentials } from './config.ts';
import { DAY_MS, RETENTION_DAYS } from './constants.ts';
import { acquireLock } from './lock.ts';
import { log } from './logger.ts';
import { updateGithub } from './sources/github.ts';
import { updateJournal } from './sources/journal.ts';
import { updateTranscripts } from './sources/transcripts.ts';
import type { State } from './state.ts';
import { loadState, saveState } from './state.ts';

// stats-publisher compute [--dry-run] | publish — see README.md.

const USAGE = 'usage: main.ts compute [--dry-run] | publish';

type Command = 'compute' | 'publish';

/** Run one source; on failure keep its previous state, log, and carry on with the others. */
function step(name: string, update: () => Record<string, number>): boolean {
  const startedAt = performance.now();
  try {
    const counts = update();
    log('info', `${name} updated`, { ...counts, ms: Math.round(performance.now() - startedAt) });
    return true;
  } catch (error) {
    log('error', `${name} failed, keeping its previous data`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

function updateAll(state: State, nowMs: number): boolean {
  const cutoffMs = nowMs - RETENTION_DAYS * DAY_MS;
  const results = [
    step('transcripts', () => ({ ...updateTranscripts(state, PATHS.transcriptsDir, cutoffMs) })),
    step('journal', () => ({ ...updateJournal(state, cutoffMs) })),
    step('github', () => ({ ...updateGithub(state, cutoffMs, nowMs) })),
  ];
  return results.every(Boolean);
}

async function run(command: Command, dryRun: boolean): Promise<boolean> {
  const startedAt = performance.now();
  const cpuStart = process.cpuUsage();
  const credentials = command === 'publish' ? readPublishCredentials() : null;

  const release = dryRun ? () => undefined : acquireLock(PATHS.stateDir);
  if (!release) {
    log('warn', 'another run holds the lock, skipping');
    return true;
  }
  try {
    const nowMs = Date.now();
    const state = loadState(PATHS.stateDir);
    const complete = updateAll(state, nowMs);
    const snapshot = parseStatsSnapshot(buildSnapshot(state, nowMs));
    // The contract drops a malformed series rather than the snapshot; ours must never be one.
    if (!snapshot?.series) throw new Error('built snapshot fails its own contract');
    const json = JSON.stringify(snapshot);
    const storeBytes = dryRun ? 0 : saveState(PATHS.stateDir, state);

    if (credentials) {
      const response = await putStatsObject(credentials, json);
      if (!response.ok) {
        throw new Error(`R2 PUT ${response.status}: ${(await response.text()).slice(0, 200)}`);
      }
    } else {
      process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    }

    const cpu = process.cpuUsage(cpuStart);
    log('info', 'run done', {
      command,
      dry_run: dryRun,
      complete,
      duration_ms: Math.round(performance.now() - startedAt),
      cpu_ms: Math.round((cpu.user + cpu.system) / 1000),
      max_rss_mb: Math.round(process.resourceUsage().maxRSS / 1024),
      store_kb: Math.round(storeBytes / 1024),
    });
    return complete;
  } finally {
    release();
  }
}

const [command, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
if ((command !== 'compute' && command !== 'publish') || (command === 'publish' && dryRun)) {
  log('error', USAGE);
  process.exit(2);
}

run(command, dryRun).then(
  (complete) => {
    // A source failed: the snapshot still went out with its last data, but the unit goes red.
    process.exitCode = complete ? 0 : 1;
  },
  (error: unknown) => {
    log('error', 'run failed', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  },
);
