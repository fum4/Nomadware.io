import assert from 'node:assert/strict';
import { test } from 'node:test';

import { emptyState } from '../state.ts';
import { foldGateEvent, parseGateEvent, parseLogfmt } from './gate-events.ts';

const line = (message: string, atMs: number): string =>
  JSON.stringify({
    MESSAGE: message,
    __CURSOR: `c${String(atMs)}`,
    __REALTIME_TIMESTAMP: String(atMs * 1000),
  });

const UNIT = 'pc-a.pre-push.service';
const FAILED = `${UNIT}: Failed with result 'exit-code'.`;
const ENDED = `${UNIT}: Consumed 9.7s CPU time, 114M memory peak.`;

test('reads the unit, the time and what happened', () => {
  assert.deepEqual(parseGateEvent(line(FAILED, 1000)), {
    kind: 'failed',
    atMs: 1000,
    unit: UNIT,
    cursor: 'c1000',
  });
  assert.equal(parseGateEvent(line(ENDED, 1000))?.kind, 'ended');
  assert.deepEqual(
    parseGateEvent(
      line(`gate=pre-push unit=${UNIT} result=failed task=pre-push cmd="pnpm check:lint"`, 2),
    ),
    { kind: 'task', atMs: 2, unit: UNIT, task: 'pre-push', cmd: 'pnpm check:lint', cursor: 'c2' },
  );
  assert.equal(parseGateEvent(line(`gate=pre-push unit=${UNIT} result=failed`, 2)), null);
  assert.equal(parseGateEvent('not json'), null);
});

test('logfmt: bare and quoted values, escapes kept literal', () => {
  const fields = parseLogfmt('gate=pre-merge task=a:b cmd="say \\"hi\\" \\\\ x" empty=');
  assert.deepEqual(Object.fromEntries(fields), {
    gate: 'pre-merge',
    task: 'a:b',
    cmd: 'say "hi" \\ x',
    empty: '',
  });
});

const foldAll = (lines: [string, number][]) => {
  const { journal } = emptyState();
  for (const [message, atMs] of lines) {
    const event = parseGateEvent(line(message, atMs));
    if (event) foldGateEvent(journal, event);
  }
  return journal;
};

test("a run's end is a check, and a pass unless its unit failed just before", () => {
  const journal = foldAll([
    [FAILED, 1],
    [ENDED, 2],
    ['pc-b.pre-merge.service: Consumed 1s CPU time.', 3],
    [ENDED, 4],
  ]);
  assert.deepEqual(journal.checksMs, [2, 3, 4]);
  assert.deepEqual(journal.failed, [{ atMs: 1, unit: UNIT }]);
  assert.deepEqual(journal.passed, [
    { atMs: 3, unit: 'pc-b.pre-merge.service' },
    { atMs: 4, unit: UNIT },
  ]);
  assert.deepEqual(journal.failing, []);
});

test("devstack's failing-task line categorises its unit's failure just before it, once", () => {
  const journal = foldAll([
    [FAILED, 1_000],
    [ENDED, 1_100],
    [`gate=pre-push unit=${UNIT} result=failed task=check:types`, 1_200],
    [`gate=pre-push unit=${UNIT} result=failed task=test`, 1_300], // no second failure: ignored
    [FAILED, 10_000],
    [`gate=pre-push unit=${UNIT} result=failed task=lint`, 10_000 + 61_000], // too late
  ]);
  assert.deepEqual(
    journal.failed.map((run) => run.category),
    ['types', undefined],
  );
});
