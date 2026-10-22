import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { IDLE_GAP_MS, MINUTE_MS } from '../constants.ts';
import type { State, TranscriptState } from '../state.ts';
import { readCompleteLines } from './line-reader.ts';

// Claude Code transcripts → per-minute agent time and tool calls, one TranscriptState per file.
// A main session is <project>/<session>.jsonl, a subagent run <project>/<session>/subagents/
// agent-*.jsonl: every file is one agent run.

interface Activity {
  atMs: number;
  toolUses: number;
}

/**
 * The activity in one transcript line, or null for anything that isn't a user/assistant turn
 * (metadata, api-request blobs, titles). Claude Code writes one line per assistant content block,
 * each repeating the message id, so tool calls are counted per line: deduping by message id would
 * drop every tool call after a message's first block.
 */
export function parseActivity(line: string): Activity | null {
  // Cheap pre-filter: most bytes are in lines that can't match (multi-MB api-request blobs).
  if (!line.includes('"type":"user"') && !line.includes('"type":"assistant"')) return null;
  let entry: unknown;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof entry !== 'object' || entry === null || !('type' in entry)) return null;
  if (entry.type !== 'user' && entry.type !== 'assistant') return null;
  if (!('timestamp' in entry) || typeof entry.timestamp !== 'string') return null;
  const atMs = Date.parse(entry.timestamp);
  if (Number.isNaN(atMs)) return null;
  let toolUses = 0;
  if (entry.type === 'assistant' && 'message' in entry) {
    const { message } = entry;
    if (typeof message === 'object' && message !== null && 'content' in message) {
      const { content } = message;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (
            typeof block === 'object' &&
            block !== null &&
            'type' in block &&
            block.type === 'tool_use'
          ) {
            toolUses += 1;
          }
        }
      }
    }
  }
  return { atMs, toolUses };
}

/** Fold one activity into a file's per-minute totals (the gap since the previous one, if short). */
export function addActivity(file: TranscriptState, activity: Activity): void {
  const key = String(Math.floor(activity.atMs / MINUTE_MS));
  const totals = file.minutes[key] ?? [0, 0];
  const gap = activity.atMs - file.lastActivityMs;
  if (file.lastActivityMs > 0 && gap > 0 && gap < IDLE_GAP_MS) totals[0] += gap;
  totals[1] += activity.toolUses;
  file.minutes[key] = totals;
  file.lastActivityMs = Math.max(file.lastActivityMs, activity.atMs);
}

function listTranscripts(dir: string): string[] {
  try {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => join(entry.parentPath, entry.name));
  } catch {
    return [];
  }
}

function pruneMinutes(file: TranscriptState, cutoffMinute: number): void {
  for (const key of Object.keys(file.minutes)) {
    if (Number(key) < cutoffMinute) delete file.minutes[key];
  }
}

export interface TranscriptScan {
  files: number;
  read: number;
  bytes: number;
}

/** Read what was appended since the last run; drop minutes older than `cutoffMs`. */
export function updateTranscripts(state: State, dir: string, cutoffMs: number): TranscriptScan {
  const cutoffMinute = Math.floor(cutoffMs / MINUTE_MS);
  const seen = new Set<string>();
  const scan: TranscriptScan = { files: 0, read: 0, bytes: 0 };

  for (const path of listTranscripts(dir)) {
    let size: number;
    let mtimeMs: number;
    try {
      ({ size, mtimeMs } = statSync(path));
    } catch {
      continue; // removed since the listing
    }
    const known = state.transcripts[path];
    // Untouched since before the retention window: nothing in it can count.
    if (mtimeMs < cutoffMs && !known) continue;
    seen.add(path);
    scan.files += 1;

    // Shorter than what we consumed: rewritten, so start over.
    let file: TranscriptState =
      known && size >= known.offset ? known : { offset: 0, lastActivityMs: 0, minutes: {} };
    if (size > file.offset) {
      const next: TranscriptState = { ...file, minutes: { ...file.minutes } };
      const offset = readCompleteLines(path, file.offset, (line) => {
        const activity = parseActivity(line);
        if (activity) addActivity(next, activity);
      });
      scan.read += 1;
      scan.bytes += offset - file.offset;
      next.offset = offset;
      file = next;
    }
    pruneMinutes(file, cutoffMinute);
    if (Object.keys(file.minutes).length === 0 && mtimeMs < cutoffMs) {
      delete state.transcripts[path];
      seen.delete(path);
      continue;
    }
    state.transcripts[path] = file;
  }

  for (const path of Object.keys(state.transcripts)) {
    if (!seen.has(path)) delete state.transcripts[path];
  }
  return scan;
}
