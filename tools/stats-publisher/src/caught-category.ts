import type { CaughtCategory } from '@nomadware/site-stats';

// What a caught issue was, from the gate's failing task (devstack's `devstack-gate` journal line,
// sources/gate-events.ts): its name and, for a step of the gate task's own run list, the failing
// command. Repos name tasks their own way, so it goes by keywords; only the category leaves the box.

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
