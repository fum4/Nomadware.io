import assert from 'node:assert/strict';
import { test } from 'node:test';

import { emptyState } from '../state.ts';
import { foldGateEvent, parseGateEvent } from './journal.ts';

const line = (message: string, atMs: number): string =>
  JSON.stringify({
    MESSAGE: message,
    __CURSOR: `c${String(atMs)}`,
    __REALTIME_TIMESTAMP: String(atMs * 1000),
  });

test('reads the unit, the time and whether it failed', () => {
  assert.deepEqual(
    parseGateEvent(line("pc-site-x.pre-push.service: Failed with result 'exit-code'.", 1000)),
    { atMs: 1000, unit: 'pc-site-x.pre-push.service', failed: true, cursor: 'c1000' },
  );
  assert.equal(parseGateEvent('not json'), null);
});

test("a run's end is a check, and a pass unless its unit failed just before", () => {
  const { journal } = emptyState();
  const fold = (message: string, atMs: number): void => {
    const event = parseGateEvent(line(message, atMs));
    if (event) foldGateEvent(journal, event);
  };
  fold("pc-a.pre-push.service: Failed with result 'exit-code'.", 1);
  fold('pc-a.pre-push.service: Consumed 9.7s CPU time.', 2);
  fold('pc-b.pre-merge.service: Consumed 1s CPU time.', 3);
  fold('pc-a.pre-push.service: Consumed 9.9s CPU time.', 4);
  assert.deepEqual(journal.checksMs, [2, 3, 4]);
  assert.deepEqual(journal.failed, [{ atMs: 1, unit: 'pc-a.pre-push.service' }]);
  assert.deepEqual(journal.passed, [
    { atMs: 3, unit: 'pc-b.pre-merge.service' },
    { atMs: 4, unit: 'pc-a.pre-push.service' },
  ]);
  assert.deepEqual(journal.failing, []);
});
