import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSnapshot } from './aggregate.ts';
import { DAY_MS, HOUR_MS, MINUTE_MS } from './constants.ts';
import { emptyState } from './state.ts';

const NOW = Date.parse('2026-10-22T12:00:00Z');
const minute = (msAgo: number): string => String(Math.floor((NOW - msAgo) / MINUTE_MS));

test('windows count only what falls inside them', () => {
  const state = emptyState();
  state.transcripts['recent'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minute(DAY_MS)]: [2 * HOUR_MS, 10] },
  };
  state.transcripts['old'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minute(20 * DAY_MS)]: [HOUR_MS, 5] },
  };
  state.journal.checksMs = [NOW - DAY_MS, NOW - 10 * DAY_MS];
  state.journal.failed = [{ atMs: NOW - 10 * DAY_MS, unit: 'pc-r.pre-push.service' }];
  state.github.prs = {
    'o/a#1': { mergedAtMs: NOW - DAY_MS, repo: 'o/a', linesAdded: 10, linesDeleted: 2 },
    'o/a#2': { mergedAtMs: NOW - 2 * DAY_MS, repo: 'o/a', linesAdded: 5, linesDeleted: 1 },
    'o/b#1': { mergedAtMs: NOW - 15 * DAY_MS, repo: 'o/b', linesAdded: 100, linesDeleted: 50 },
  };

  const { windows, generatedAt } = buildSnapshot(state, NOW);
  assert.equal(generatedAt, '2026-10-22T12:00:00.000Z');
  assert.deepEqual(windows['7d'], {
    prs: 2,
    runs: 1,
    agentHours: 2,
    checks: 1,
    caught: 0,
    actions: 10,
    linesAdded: 15,
    linesDeleted: 3,
    repos: 1,
  });
  assert.deepEqual(windows['30d'], {
    prs: 3,
    runs: 2,
    agentHours: 3,
    checks: 2,
    caught: 1,
    actions: 15,
    linesAdded: 115,
    linesDeleted: 53,
    repos: 2,
  });
});

test('the published JSON carries no names', () => {
  const state = emptyState();
  state.transcripts['/home/x/.claude/projects/-secret-repo/s.jsonl'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minute(HOUR_MS)]: [MINUTE_MS, 1] },
  };
  state.github.prs['owner/secret-repo#9'] = {
    mergedAtMs: NOW - HOUR_MS,
    repo: 'owner/secret-repo',
    linesAdded: 1,
    linesDeleted: 0,
  };
  assert.doesNotMatch(JSON.stringify(buildSnapshot(state, NOW)), /secret|owner|projects/);
});
