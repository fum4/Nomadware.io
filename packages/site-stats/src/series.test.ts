import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bucketCount, bucketStartMs, parseStatsSeries } from './series.ts';
import { parseStatsSnapshot } from './snapshot.ts';

const counts = (buckets: number, value: (index: number) => number): number[] =>
  Array.from({ length: buckets }, (_, index) => value(index));
const windowSeries = (bucketHours: number, buckets: number) => ({
  bucketHours,
  agentMinutes: counts(buckets, (index) => index),
  prsMerged: counts(buckets, () => 1),
  linesAdded: counts(buckets, (index) => index * 10),
  linesDeleted: counts(buckets, () => 0),
  runs: counts(buckets, (index) => index % 3),
  actions: counts(buckets, (index) => index * 7),
  checks: counts(buckets, () => 2),
  caught: counts(buckets, (index) => (index === 5 ? 3 : 0)),
  caughtFixMinutes: Array.from({ length: buckets }, (_, index): number | null =>
    index === 5 ? 14 : null,
  ),
});
const SERIES = { '7d': windowSeries(2, 84), '30d': windowSeries(6, 120) };

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

test('rejects bad lengths, sizes, negatives, fractions, text and a missing array', () => {
  assert.equal(parseStatsSeries(withWeek({ agentMinutes: [1, 2, 3] })), null);
  assert.equal(parseStatsSeries(withWeek({ prsMerged: SERIES['30d'].prsMerged })), null);
  assert.equal(parseStatsSeries(withWeek({ linesAdded: SERIES['7d'].linesAdded.slice(1) })), null);
  assert.equal(parseStatsSeries(withWeek({ linesDeleted: undefined })), null);
  assert.equal(parseStatsSeries(withWeek({ bucketHours: 6 })), null);
  const negative = [...SERIES['7d'].agentMinutes];
  negative[3] = -1;
  assert.equal(parseStatsSeries(withWeek({ agentMinutes: negative })), null);
  const fraction = [...SERIES['7d'].prsMerged];
  fraction[0] = 0.5;
  assert.equal(parseStatsSeries(withWeek({ prsMerged: fraction })), null);
  const text = [...SERIES['7d'].prsMerged].map(String);
  assert.equal(parseStatsSeries(withWeek({ prsMerged: text })), null);
  const negativeLines = [...SERIES['7d'].linesDeleted];
  negativeLines[83] = -1;
  assert.equal(parseStatsSeries(withWeek({ linesDeleted: negativeLines })), null);
  assert.equal(parseStatsSeries(withWeek({ caught: SERIES['7d'].caught.slice(1) })), null);
  const negativeRuns = [...SERIES['7d'].runs];
  negativeRuns[0] = -1;
  assert.equal(parseStatsSeries(withWeek({ runs: negativeRuns })), null);
  const fractionFix = [...SERIES['7d'].caughtFixMinutes];
  fractionFix[5] = 1.5;
  assert.equal(parseStatsSeries(withWeek({ caughtFixMinutes: fractionFix })), null);
  assert.equal(parseStatsSeries(withWeek({ caughtFixMinutes: [14] })), null);
  assert.equal(parseStatsSeries({ '7d': SERIES['7d'] }), null);
  assert.equal(parseStatsSeries(undefined), null);
});

test('a series from before the per-stat arrays is dropped whole', () => {
  for (const key of ['runs', 'actions', 'checks', 'caught', 'caughtFixMinutes']) {
    assert.equal(parseStatsSeries(withWeek({ [key]: undefined })), null);
  }
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
