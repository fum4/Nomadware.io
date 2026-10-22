import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { STATE_FILE_NAME } from './constants.ts';
import { log } from './logger.ts';

// The incremental store: everything a run needs so it reads only what is new since the last one.
// Local to the box, never published (it names files and repos; only aggregates leave).

/** Per-minute totals of one transcript: [active ms, tool_use count], keyed by epoch minute. */
export type MinuteTotals = Record<string, [number, number]>;

export interface TranscriptState {
  /** Bytes consumed (always just past a newline: a half-written last line is re-read next run). */
  offset: number;
  /** Timestamp of the last activity entry, for the gap to the next one. */
  lastActivityMs: number;
  minutes: MinuteTotals;
}

export interface MergedPr {
  mergedAtMs: number;
  repo: string;
  linesAdded: number;
  linesDeleted: number;
}

export interface State {
  version: typeof STATE_VERSION;
  transcripts: Record<string, TranscriptState>;
  journal: { cursor: string | null; checksMs: number[]; caughtMs: number[] };
  /** Merged PRs are immutable, so each one's file stats are fetched once and kept until it ages out. */
  github: { syncedThroughMs: number | null; prs: Record<string, MergedPr> };
}

/** Bump on any shape change: an older store is discarded and the next run backfills. */
const STATE_VERSION = 1;

export function emptyState(): State {
  return {
    version: STATE_VERSION,
    transcripts: {},
    journal: { cursor: null, checksMs: [], caughtMs: [] },
    github: { syncedThroughMs: null, prs: {} },
  };
}

function isState(value: unknown): value is State {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === STATE_VERSION &&
    'transcripts' in value &&
    'journal' in value &&
    'github' in value
  );
}

export function loadState(stateDir: string): State {
  let raw: string;
  try {
    raw = readFileSync(join(stateDir, STATE_FILE_NAME), 'utf8');
  } catch {
    log('info', 'no store yet, backfilling');
    return emptyState();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isState(parsed)) return parsed;
  } catch {
    // fall through: a corrupt store is rebuilt, never trusted
  }
  log('warn', 'store unreadable or from another version, backfilling');
  return emptyState();
}

/** Write-then-rename, so a crash mid-write leaves the previous store intact. */
export function saveState(stateDir: string, state: State): number {
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const path = join(stateDir, STATE_FILE_NAME);
  const json = JSON.stringify(state);
  writeFileSync(`${path}.tmp`, json, { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
  return json.length;
}
