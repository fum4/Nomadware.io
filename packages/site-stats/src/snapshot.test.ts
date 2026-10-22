import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseStatsSnapshot } from './snapshot.ts';

const WINDOW = {
  prs: 1,
  runs: 2,
  agentHours: 3,
  checks: 4,
  caught: 0,
  actions: 5,
  linesAdded: 6,
  linesDeleted: 7,
  repos: 1,
};
const VALID = { generatedAt: '2026-10-22T19:23:03Z', windows: { '7d': WINDOW, '30d': WINDOW } };

test('accepts a complete snapshot', () => {
  assert.deepEqual(parseStatsSnapshot(VALID), VALID);
});

test('drops unknown fields', () => {
  const parsed = parseStatsSnapshot({ ...VALID, extra: true });
  assert.deepEqual(parsed, VALID);
});

test('rejects a missing window, a missing count, a bad date, a negative or non-numeric count', () => {
  assert.equal(parseStatsSnapshot({ ...VALID, windows: { '7d': WINDOW } }), null);
  const { prs: _prs, ...withoutPrs } = WINDOW;
  assert.equal(
    parseStatsSnapshot({ ...VALID, windows: { ...VALID.windows, '7d': withoutPrs } }),
    null,
  );
  assert.equal(parseStatsSnapshot({ ...VALID, generatedAt: 'yesterday' }), null);
  const negative = { ...WINDOW, runs: -1 };
  assert.equal(
    parseStatsSnapshot({ ...VALID, windows: { ...VALID.windows, '30d': negative } }),
    null,
  );
  const text = { ...WINDOW, runs: '2' };
  assert.equal(parseStatsSnapshot({ ...VALID, windows: { ...VALID.windows, '30d': text } }), null);
  assert.equal(parseStatsSnapshot(null), null);
  assert.equal(parseStatsSnapshot([]), null);
});
