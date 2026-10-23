import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bucketCount, bucketStartMs, parseStatsSeries } from './series.ts';
import { parseStatsSnapshot } from './snapshot.ts';

const days = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    linesAdded: index,
    linesDeleted: 0,
  }));
const windowSeries = (bucketHours: number, buckets: number, dayCount: number) => ({
  bucketHours,
  agentMinutes: Array.from({ length: buckets }, (_, index) => index),
  prsMerged: Array.from({ length: buckets }, () => 1),
  days: days(dayCount),
});
const SERIES = { '7d': windowSeries(2, 84, 7), '30d': windowSeries(6, 120, 30) };

const COUNTS = {
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
const SNAPSHOT = { generatedAt: '2026-10-22T19:23:03Z', windows: { '7d': COUNTS, '30d': COUNTS } };

const withWeek = (patch: Record<string, unknown>) => ({
  ...SERIES,
  '7d': { ...SERIES['7d'], ...patch },
});

test('bucket counts follow the window and bucket size', () => {
  assert.equal(bucketCount('7d'), 84);
  assert.equal(bucketCount('30d'), 120);
});

test('accepts a complete series', () => {
  assert.deepEqual(parseStatsSeries(SERIES), SERIES);
});

test('rejects bad lengths, sizes, negatives, fractions and bad dates', () => {
  assert.equal(parseStatsSeries(withWeek({ agentMinutes: [1, 2, 3] })), null);
  assert.equal(parseStatsSeries(withWeek({ prsMerged: SERIES['30d'].prsMerged })), null);
  assert.equal(parseStatsSeries(withWeek({ days: days(6) })), null);
  assert.equal(parseStatsSeries(withWeek({ bucketHours: 6 })), null);
  const negative = [...SERIES['7d'].agentMinutes];
  negative[3] = -1;
  assert.equal(parseStatsSeries(withWeek({ agentMinutes: negative })), null);
  const fraction = [...SERIES['7d'].prsMerged];
  fraction[0] = 0.5;
  assert.equal(parseStatsSeries(withWeek({ prsMerged: fraction })), null);
  const text = [...SERIES['7d'].prsMerged].map(String);
  assert.equal(parseStatsSeries(withWeek({ prsMerged: text })), null);
  for (const date of ['2026-02-30', '22/10/2026', '2026-10-22T00:00:00Z']) {
    const badDay = [{ date, linesAdded: 1, linesDeleted: 1 }, ...days(6)];
    assert.equal(parseStatsSeries(withWeek({ days: badDay })), null, date);
  }
  const negativeLines = [{ date: '2026-10-01', linesAdded: 1, linesDeleted: -1 }, ...days(6)];
  assert.equal(parseStatsSeries(withWeek({ days: negativeLines })), null);
  assert.equal(parseStatsSeries({ '7d': SERIES['7d'] }), null);
  assert.equal(parseStatsSeries(undefined), null);
});

test('a snapshot without a series is still valid', () => {
  assert.deepEqual(parseStatsSnapshot(SNAPSHOT), SNAPSHOT);
});

test('a snapshot keeps a valid series and drops a malformed one', () => {
  assert.deepEqual(parseStatsSnapshot({ ...SNAPSHOT, series: SERIES }), {
    ...SNAPSHOT,
    series: SERIES,
  });
  const broken = { ...SNAPSHOT, series: withWeek({ agentMinutes: [] }) };
  assert.deepEqual(parseStatsSnapshot(broken), SNAPSHOT);
});

test('the last bucket holds generatedAt, the ones before step back by the bucket size', () => {
  const generatedAtMs = Date.parse('2026-10-22T19:23:03Z');
  assert.equal(bucketStartMs(generatedAtMs, 2, 83, 84), Date.parse('2026-10-22T18:00:00Z'));
  assert.equal(bucketStartMs(generatedAtMs, 2, 82, 84), Date.parse('2026-10-22T16:00:00Z'));
  assert.equal(bucketStartMs(generatedAtMs, 6, 119, 120), Date.parse('2026-10-22T18:00:00Z'));
  assert.equal(bucketStartMs(generatedAtMs, 6, 0, 120), Date.parse('2026-09-23T00:00:00Z'));
});
