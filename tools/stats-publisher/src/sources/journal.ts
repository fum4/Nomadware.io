import { spawnSync } from 'node:child_process';

import { GATE_JOURNAL_PATTERN } from '../constants.ts';
import type { State } from '../state.ts';
import { foldGateEvent, parseGateEvent } from './gate-events.ts';

// Git-hook gate runs from the user journal (what each line means: gate-events.ts). Unit names
// (they carry worktree slugs) never leave the box.

const JOURNAL_MAX_BYTES = 256 * 1024 * 1024;

export interface JournalScan {
  events: number;
}

function queryJournal(from: string): string {
  const result = spawnSync(
    'journalctl',
    [
      '--user',
      from,
      // Two values of one field: journalctl ORs them.
      'SYSLOG_IDENTIFIER=systemd',
      'SYSLOG_IDENTIFIER=devstack-gate',
      `--grep=${GATE_JOURNAL_PATTERN}`,
      '--output=json',
      '--output-fields=MESSAGE',
      '--no-pager',
      '--quiet',
    ],
    { encoding: 'utf8', maxBuffer: JOURNAL_MAX_BYTES },
  );
  if (result.error) throw result.error;
  // journalctl exits 1 with no output when --grep matches nothing: "no new events", not a failure.
  const noMatches = result.status === 1 && result.stdout === '' && result.stderr.trim() === '';
  if (result.status !== 0 && !noMatches) {
    throw new Error(`journalctl exited ${String(result.status)}: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function sinceSeconds(ms: number): string {
  return `--since=@${Math.floor(ms / 1000)}`;
}

function latestEventMs(state: State): number {
  return Math.max(0, ...state.journal.checksMs, ...state.journal.failed.map((run) => run.atMs));
}

/** Read gate events since the saved cursor (first run: since `cutoffMs`); drop older ones. */
export function updateJournal(state: State, cutoffMs: number): JournalScan {
  const { journal } = state;
  let output: string;
  try {
    output = queryJournal(
      journal.cursor ? `--after-cursor=${journal.cursor}` : sinceSeconds(cutoffMs),
    );
  } catch (error) {
    if (!journal.cursor) throw error;
    // A cursor the journal no longer knows (vacuumed, rotated away): resume from the last event's
    // second instead. An event in that same second may count twice; acceptable for a vanity stat.
    output = queryJournal(sinceSeconds(Math.max(cutoffMs, latestEventMs(state) + 1000)));
  }

  let events = 0;
  for (const line of output.split('\n')) {
    const event = parseGateEvent(line);
    if (!event) continue;
    events += 1;
    foldGateEvent(journal, event);
    journal.cursor = event.cursor;
  }
  journal.checksMs = journal.checksMs.filter((atMs) => atMs >= cutoffMs);
  journal.failed = journal.failed.filter((run) => run.atMs >= cutoffMs);
  journal.passed = journal.passed.filter((run) => run.atMs >= cutoffMs);
  return { events };
}
