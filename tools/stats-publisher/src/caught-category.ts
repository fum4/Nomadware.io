import type { CaughtCategory, CaughtGate } from '@nomadware/site-stats';

// What a caught issue was: which gate caught it, from its unit's name (`pc-<worktree>.pre-push`
// or `.pre-merge`), and its kind, from the gate's failing task (devstack's `devstack-gate` journal
// line, sources/gate-events.ts): its name and, for a step of the gate task's own run list, the
// failing command. Repos name tasks their own way, so that goes by keywords. Only the gate and
// the category leave the box.

/** First match wins, in this order. */
const CATEGORY_KEYWORDS: readonly (readonly [CaughtCategory, RegExp])[] = [
  ['format', /fmt|format|prettier|oxfmt/i],
  ['lint', /lint|oxlint|eslint/i],
  ['types', /types|typecheck|tsc|astro check/i],
  ['tests', /test|vitest|jest|e2e/i],
  ['build', /build/i],
];

const categoryOf = (text: string): CaughtCategory =>
  CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';

/** The failing command says more than its task (a gate task's run list); else the task does. */
export function caughtCategory(task: string, cmd: string | undefined): CaughtCategory {
  const fromCmd = cmd === undefined ? 'other' : categoryOf(cmd);
  return fromCmd === 'other' ? categoryOf(task) : fromCmd;
}

const GATE_UNIT = /\.pre-(push|merge)\.service$/;

/** The gate a unit runs; null for a unit that isn't one. */
export function caughtGate(unit: string): CaughtGate | null {
  const gate = GATE_UNIT.exec(unit)?.[1];
  return gate === 'push' || gate === 'merge' ? gate : null;
}
