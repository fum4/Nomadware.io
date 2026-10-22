import { spawnSync } from 'node:child_process';

import { GATE_JOURNAL_PATTERN } from '../constants.ts';
import type { State } from '../state.ts';

// Git-hook gate runs from the user journal: systemd logs "<unit>: Consumed …" when a gate unit
// finishes (a run) and "<unit>: Failed with result …" when it failed (a catch). Only timestamps
// are kept; unit names (they carry worktree slugs) never leave this function.

const JOURNAL_MAX_BYTES = 256 * 1024 * 1024;

interface GateEvent {
  atMs: number;
  failed: boolean;
  cursor: string;
}

// journald's own (double-underscore) fields.
const CURSOR_FIELD = '__CURSOR';
const REALTIME_FIELD = '__REALTIME_TIMESTAMP';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseGateEvent(line: string): GateEvent | null {
  let entry: unknown;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord(entry)) return null;
  const message = entry['MESSAGE'];
  const cursor = entry[CURSOR_FIELD];
  const realtimeUs = entry[REALTIME_FIELD];
  if (typeof message !== 'string' || typeof cursor !== 'string' || typeof realtimeUs !== 'string') {
    return null;
  }
  const atMs = Math.floor(Number(realtimeUs) / 1000);
  if (!Number.isFinite(atMs)) return null;
  return { atMs, failed: message.includes(': Failed with result'), cursor };
}

export interface JournalScan {
  events: number;
}

function queryJournal(from: string): string {
  const result = spawnSync(
    'journalctl',
    [
      '--user',
      from,
      'SYSLOG_IDENTIFIER=systemd',
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
  return Math.max(0, ...state.journal.checksMs, ...state.journal.caughtMs);
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
    (event.failed ? journal.caughtMs : journal.checksMs).push(event.atMs);
    journal.cursor = event.cursor;
  }
  journal.checksMs = journal.checksMs.filter((atMs) => atMs >= cutoffMs);
  journal.caughtMs = journal.caughtMs.filter((atMs) => atMs >= cutoffMs);
  return { events };
}
