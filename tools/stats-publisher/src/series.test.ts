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

test('an empty store gives full-length series of zeros, days ending today (UTC)', () => {
  const series = buildSeries(emptyState(), NOW);
  assert.equal(series['7d'].agentMinutes.length, 84);
  assert.equal(series['30d'].prsMerged.length, 120);
  assert.ok(series['7d'].agentMinutes.every((value) => value === 0));
  assert.deepEqual(
    series['7d'].days.map((day) => day.date),
    [
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
    ],
  );
  assert.equal(series['30d'].days[0]?.date, '2026-09-23');
  assert.ok(series['30d'].days.every((day) => day.linesAdded === 0 && day.linesDeleted === 0));
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

test('a PR counts in its merge bucket, its lines on its merge day (UTC)', () => {
  const state = emptyState();
  state.github.prs = {
    a: pr('2026-10-22T00:00:00Z', 10, 1), // first instant of today
    b: pr('2026-10-21T23:59:59Z', 5, 2), // last second of yesterday
    c: pr('2026-10-21T12:00:00Z', 7, 0),
    d: pr('2026-10-15T10:00:00Z', 100, 100), // in the 30d series only
  };
  const { '7d': week, '30d': month } = buildSeries(state, NOW);
  assert.deepEqual(week.days.at(-1), { date: '2026-10-22', linesAdded: 10, linesDeleted: 1 });
  assert.deepEqual(week.days.at(-2), { date: '2026-10-21', linesAdded: 12, linesDeleted: 2 });
  assert.deepEqual(week.days.at(-3), { date: '2026-10-20', linesAdded: 0, linesDeleted: 0 });
  assert.equal(
    week.prsMerged.reduce((sum, value) => sum + value, 0),
    3,
  );
  assert.equal(week.prsMerged[83 - 9], 1); // 00:00–02:00 today
  assert.equal(week.prsMerged[83 - 10], 1); // 22:00–24:00 yesterday
  assert.deepEqual(month.days.at(-8), { date: '2026-10-15', linesAdded: 100, linesDeleted: 100 });
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
  assert.ok(month.days.every((day) => day.linesAdded === 0));
});
