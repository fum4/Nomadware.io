import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAY_MS, HOUR_MS, MINUTE_MS } from './constants.ts';
import { SERIES_COUNTS } from '@nomadware/site-stats';

import { buildSeries } from './series.ts';
import type { MergedPr } from './state.ts';
import { emptyState } from './state.ts';

// 19:23 UTC: the last 2h bucket is 18:00–20:00, the last 6h one 18:00–24:00.
const NOW = Date.parse('2026-10-22T19:23:00Z');
const at = (iso: string): number => Date.parse(iso);
const minuteKey = (iso: string): string => String(Math.floor(at(iso) / MINUTE_MS));
const run = (iso: string, unit: string) => ({ atMs: at(iso), unit });
const pr = (mergedAt: string, linesAdded: number, linesDeleted: number): MergedPr => ({
  mergedAtMs: at(mergedAt),
  repo: 'o/r',
  linesAdded,
  linesDeleted,
});

test('an empty store gives full-length series of zeros', () => {
  const series = buildSeries(emptyState(), NOW);
  for (const window of ['7d', '30d'] as const) {
    const length = window === '7d' ? 84 : 120;
    for (const key of SERIES_COUNTS) {
      const values = series[window][key];
      assert.equal(values.length, length);
      assert.ok(values.every((value) => value === 0));
    }
    for (const values of [series[window].caughtFixMinutes, series[window].caughtCategories]) {
      assert.equal(values.length, length);
      assert.ok(values.every((value) => value === null));
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

test('tool calls land per minute; a run counts once, in its first bucket inside the series', () => {
  const state = emptyState();
  state.transcripts['a'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: {
      [minuteKey('2026-10-22T18:10:00Z')]: [MINUTE_MS, 4],
      [minuteKey('2026-10-22T16:05:00Z')]: [MINUTE_MS, 3], // its first bucket in the 7d series
      [minuteKey('2026-10-15T17:59:00Z')]: [MINUTE_MS, 9], // before the 7d series: 30d only
    },
  };
  state.transcripts['b'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minuteKey('2026-10-22T18:30:00Z')]: [MINUTE_MS, 1] },
  };
  state.transcripts['old'] = {
    offset: 1,
    lastActivityMs: 0,
    minutes: { [minuteKey('2026-09-01T00:00:00Z')]: [MINUTE_MS, 1] },
  };
  const { '7d': week, '30d': month } = buildSeries(state, NOW);
  assert.deepEqual([week.actions[83], week.actions[82]], [5, 3]);
  assert.deepEqual([week.runs[83], week.runs[82]], [1, 1]);
  assert.equal(
    week.runs.reduce((sum, value) => sum + value, 0),
    2,
  );
  // 30d: a's first bucket is 15 Oct 12:00–18:00 (the 91st), b's the last.
  assert.deepEqual([month.runs[90], month.runs[118], month.runs[119]], [1, 0, 1]);
  assert.equal(month.actions[90], 9);
  assert.equal(
    month.actions.reduce((sum, value) => sum + value, 0),
    17,
  );
});

test('gate runs and failures count in the bucket they finished in', () => {
  const state = emptyState();
  state.journal.checksMs = [
    at('2026-10-22T18:00:00Z'),
    at('2026-10-22T19:00:00Z'),
    at('2026-10-22T17:59:59Z'),
    at('2026-09-01T00:00:00Z'), // before every series
  ];
  state.journal.failed = [
    { atMs: at('2026-10-22T19:00:00Z'), unit: 'pc-a.pre-push.service' },
    { atMs: at('2026-10-15T10:00:00Z'), unit: 'pc-b.pre-push.service' },
  ];
  const { '7d': week, '30d': month } = buildSeries(state, NOW);
  assert.deepEqual([week.checks[83], week.checks[82]], [2, 1]);
  assert.equal(
    week.checks.reduce((sum, value) => sum + value, 0),
    3,
  );
  assert.deepEqual([week.caught[83], week.caught.reduce((sum, value) => sum + value, 0)], [1, 1]);
  assert.deepEqual([month.caught[119], month.caught[89]], [1, 1]);
});

test("a bucket's fix time is its longest, and none while any of its issues is unfixed", () => {
  const state = emptyState();
  state.journal.failed = [
    run('2026-10-22T10:00:00Z', 'a'), // fixed 10:30 → 30 min
    run('2026-10-22T11:00:00Z', 'b'), // fixed 13:00 → 120 min, same bucket
    run('2026-10-22T16:10:00Z', 'a'), // fixed 16:20 → 10 min
    run('2026-10-22T16:40:00Z', 'c'), // never passes: unfixed
  ];
  state.journal.passed = [
    run('2026-10-22T10:30:00Z', 'a'),
    run('2026-10-22T13:00:00Z', 'b'),
    run('2026-10-22T16:20:00Z', 'a'),
  ];
  const { '7d': week } = buildSeries(state, NOW);
  // 2h buckets: 10–12 is 79, 16–18 is 82.
  assert.equal(week.caughtFixMinutes[79], 120);
  assert.equal(week.caughtFixMinutes[82], null);
  assert.equal(week.caughtFixMinutes[80], null);
  assert.deepEqual([week.caught[79], week.caught[82]], [2, 2]);
});

test('caught issues count per category where devstack named the task; none says → null', () => {
  const state = emptyState();
  state.journal.failed = [
    { ...run('2026-10-22T18:10:00Z', 'a'), category: 'tests' },
    { ...run('2026-10-22T18:20:00Z', 'a'), category: 'tests' },
    { ...run('2026-10-22T18:30:00Z', 'b'), category: 'types' },
    run('2026-10-22T18:40:00Z', 'c'), // before devstack logged tasks: counted, not categorised
    run('2026-10-22T16:00:00Z', 'c'),
  ];
  const { '7d': week } = buildSeries(state, NOW);
  assert.deepEqual(week.caughtCategories[83], [0, 0, 1, 2, 0, 0]);
  assert.equal(week.caughtCategories[82], null);
  assert.deepEqual([week.caught[83], week.caught[82]], [4, 1]);
});
