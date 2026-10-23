import { spawnSync } from 'node:child_process';

import { GATE_JOURNAL_PATTERN } from '../constants.ts';
import type { JournalState, State } from '../state.ts';

// Git-hook gate runs from the user journal: systemd logs "<unit>: Failed with result …" when a gate
// unit failed (a catch), then "<unit>: Consumed …" as any run ends (a check). A run that ends
// without a failure logged first is a pass. Unit names (they carry worktree slugs) stay in the
// local store, to pair a failure with its unit's next pass; they are never published.

const JOURNAL_MAX_BYTES = 256 * 1024 * 1024;

export interface GateEvent {
  atMs: number;
  unit: string;
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
  const unit = message.slice(0, message.indexOf(': '));
  if (!unit) return null;
  return { atMs, unit, failed: message.includes(': Failed with result'), cursor };
}

/** One gate line into the store: a failure, or a run's end (a pass unless its unit just failed). */
export function foldGateEvent(journal: JournalState, event: GateEvent): void {
  const { atMs, unit } = event;
  if (event.failed) {
    journal.failed.push({ atMs, unit });
    if (!journal.failing.includes(unit)) journal.failing.push(unit);
    return;
  }
  journal.checksMs.push(atMs);
  if (journal.failing.includes(unit)) {
    journal.failing = journal.failing.filter((other) => other !== unit);
  } else {
    journal.passed.push({ atMs, unit });
  }
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
