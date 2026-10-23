import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAY_MS, HOUR_MS, MINUTE_MS } from './constants.ts';
import { buildSeries } from './series.ts';
import type { MergedPr } from './state.ts';
import { emptyState } from './state.ts';

// 19:23 UTC: the last 2h bucket is 18:00–20:00, the last 6h one 18:00–24:00.
const NOW = Date.parse('2026-10-22T19:23:00Z');
const at = (iso: string): number => Date.parse(iso);
const minuteKey = (iso: string): string => String(Math.floor(at(iso) / MINUTE_MS));
const pr = (mergedAt: string, linesAdded: number, linesDeleted: number): MergedPr => ({
  mergedAtMs: at(mergedAt),
  repo: 'o/r',
  linesAdded,
  linesDeleted,
});

test('an empty store gives full-length series of zeros', () => {
  const series = buildSeries(emptyState(), NOW);
  for (const window of ['7d', '30d'] as const) {
    const { agentMinutes, prsMerged, linesAdded, linesDeleted } = series[window];
    const length = window === '7d' ? 84 : 120;
    for (const values of [agentMinutes, prsMerged, linesAdded, linesDeleted]) {
      assert.equal(values.length, length);
      assert.ok(values.every((value) => value === 0));
    }
  }
});

test('agent time lands in its bucket by minute: boundaries are inclusive at the start', () => {
  const state = emptyState();
  state.transcripts['a'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: {
      [minuteKey('2026-10-22T18:00:00Z')]: [30 * MINUTE_MS, 1], // first minute of the last bucket
      [minuteKey('2026-10-22T17:59:00Z')]: [20 * MINUTE_MS, 1], // last minute of the one before
      [minuteKey('2026-10-15T17:59:00Z')]: [HOUR_MS, 1], // before the 7d buckets start (15 Oct 20:00)
    },
  };
  state.transcripts['b'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minuteKey('2026-10-22T18:30:00Z')]: [15 * MINUTE_MS, 2] },
  };
  const { '7d': week, '30d': month } = buildSeries(state, NOW);
  assert.equal(week.agentMinutes[83], 45);
  assert.equal(week.agentMinutes[82], 20);
  assert.equal(week.agentMinutes[0], 0);
  assert.equal(
    week.agentMinutes.reduce((sum, value) => sum + value, 0),
    65,
  );
  // 6h buckets: 12:00–18:00 holds 17:59, 18:00– holds the rest; 15 Oct 12:00–18:00 is the 91st.
  assert.equal(month.agentMinutes[119], 45);
  assert.equal(month.agentMinutes[118], 20);
  assert.equal(month.agentMinutes[90], 60);
});

test('a PR and its lines count in its merge bucket: boundaries inclusive at the start', () => {
  const state = emptyState();
  state.github.prs = {
    a: pr('2026-10-22T18:00:00Z', 10, 1), // first instant of the last bucket
    b: pr('2026-10-22T17:59:59Z', 5, 2), // last second of the one before
    c: pr('2026-10-22T16:30:00Z', 7, 0), // same 2h bucket as b
    d: pr('2026-10-15T10:00:00Z', 100, 100), // before the 7d buckets: 30d only
  };
  const { '7d': week, '30d': month } = buildSeries(state, NOW);
  assert.deepEqual([week.prsMerged[83], week.linesAdded[83], week.linesDeleted[83]], [1, 10, 1]);
  assert.deepEqual([week.prsMerged[82], week.linesAdded[82], week.linesDeleted[82]], [2, 12, 2]);
  assert.equal(week.linesAdded[81], 0);
  assert.equal(
    week.prsMerged.reduce((sum, value) => sum + value, 0),
    3,
  );
  // 6h buckets: 12:00–18:00 holds b and c; 15 Oct 06:00–12:00 holds d.
  assert.deepEqual([month.linesAdded[119], month.linesAdded[118]], [10, 12]);
  assert.equal(month.linesDeleted[89], 100);
  assert.equal(
    month.prsMerged.reduce((sum, value) => sum + value, 0),
    4,
  );
});

test('nothing older than the window or newer than now leaks in', () => {
  const state = emptyState();
  state.github.prs = { old: pr(new Date(NOW - 31 * DAY_MS).toISOString(), 1, 1) };
  const { '30d': month } = buildSeries(state, NOW);
  assert.ok(month.prsMerged.every((value) => value === 0));
  assert.ok(month.linesAdded.every((value) => value === 0));
});
