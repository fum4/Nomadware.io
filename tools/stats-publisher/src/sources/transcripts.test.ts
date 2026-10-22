import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { emptyState } from '../state.ts';
import { parseActivity, updateTranscripts } from './transcripts.ts';

const T0 = Date.parse('2026-10-20T10:00:00Z');
const iso = (offsetMs: number): string => new Date(T0 + offsetMs).toISOString();
const assistant = (offsetMs: number, block: string): string =>
  JSON.stringify({
    type: 'assistant',
    timestamp: iso(offsetMs),
    requestId: 'req_1',
    message: { id: 'msg_1', content: [{ type: block, id: `toolu_${offsetMs}` }] },
  });
const user = (offsetMs: number): string =>
  JSON.stringify({ type: 'user', timestamp: iso(offsetMs), message: { content: 'hi' } });

const dir = mkdtempSync(join(tmpdir(), 'stats-transcripts-'));
after(() => rmSync(dir, { recursive: true, force: true }));

test('counts every tool_use line, even when lines share a message id', () => {
  assert.deepEqual(parseActivity(assistant(0, 'tool_use')), { atMs: T0, toolUses: 1 });
  assert.deepEqual(parseActivity(assistant(0, 'text')), { atMs: T0, toolUses: 0 });
  assert.equal(parseActivity(JSON.stringify({ type: 'ai-title', timestamp: iso(0) })), null);
  assert.equal(parseActivity('{"type":"user", broken'), null);
});

test('sums short gaps only, reads incrementally, and counts subagent files as runs', () => {
  const project = join(dir, '-home-x-code-repo');
  mkdirSync(join(project, 'session', 'subagents'), { recursive: true });
  const main = join(project, 'session.jsonl');
  // 2 min gap counts, 10 min gap is idle, 1 min gap counts: 3 min active, 2 tool calls.
  writeFileSync(
    main,
    [
      user(0),
      assistant(2 * 60_000, 'tool_use'),
      user(12 * 60_000),
      assistant(13 * 60_000, 'tool_use'),
    ]
      .map((line) => `${line}\n`)
      .join(''),
  );
  writeFileSync(join(project, 'session', 'subagents', 'agent-a.jsonl'), `${user(0)}\n`);

  const state = emptyState();
  const first = updateTranscripts(state, dir, T0 - 1);
  assert.equal(first.files, 2);
  const total = (index: 0 | 1): number =>
    Object.values(state.transcripts[main]?.minutes ?? {}).reduce(
      (sum, minute) => sum + minute[index],
      0,
    );
  assert.equal(total(0), 3 * 60_000);
  assert.equal(total(1), 2);

  // Nothing new: nothing read. Then a half-written line is left for later.
  assert.equal(updateTranscripts(state, dir, T0 - 1).read, 0);
  appendFileSync(main, `${assistant(14 * 60_000, 'tool_use')}\n{"type":"user"`);
  updateTranscripts(state, dir, T0 - 1);
  assert.equal(total(0), 4 * 60_000);
  assert.equal(total(1), 3);
});
