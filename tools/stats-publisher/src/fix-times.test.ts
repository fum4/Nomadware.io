import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MINUTE_MS } from './constants.ts';
import { fixMinutes } from './fix-times.ts';
import { emptyState } from './state.ts';

const T0 = Date.parse('2026-10-22T10:00:00Z');
const run = (minutes: number, unit: string) => ({ atMs: T0 + minutes * MINUTE_MS, unit });

test('failures in a row up to the next pass are one episode, timed from its first failure', () => {
  const { journal } = emptyState();
  journal.failed = [run(0, 'a'), run(5, 'a'), run(9, 'a'), run(30, 'a')];
  journal.passed = [run(14, 'a'), run(32, 'a')];
  assert.deepEqual(fixMinutes(journal), [14, 14, 14, 2]);
});

test('each gate unit has its own episodes; a unit with no pass since stays unfixed', () => {
  const { journal } = emptyState();
  journal.failed = [run(0, 'a'), run(1, 'b'), run(50, 'b')];
  journal.passed = [run(3, 'b'), run(80, 'a')];
  assert.deepEqual(fixMinutes(journal), [80, 2, null]);
});

test('a pass before any failure fixes nothing; a fix within the minute reads 1', () => {
  const { journal } = emptyState();
  journal.failed = [run(10, 'a')];
  journal.passed = [run(0, 'a'), run(10.2, 'a')];
  assert.deepEqual(fixMinutes(journal), [1]);
});
