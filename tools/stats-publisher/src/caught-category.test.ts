import assert from 'node:assert/strict';
import { test } from 'node:test';

import { caughtCategory } from './caught-category.ts';

test('maps task names by keyword', () => {
  assert.equal(caughtCategory('check:format', undefined), 'format');
  assert.equal(caughtCategory('lint', undefined), 'lint');
  assert.equal(caughtCategory('check:types', undefined), 'types');
  assert.equal(caughtCategory('typecheck', undefined), 'types');
  assert.equal(caughtCategory('e2e:smoke', undefined), 'tests');
  assert.equal(caughtCategory('marketing:build', undefined), 'build');
  assert.equal(caughtCategory('secrets:check', undefined), 'other');
});

test("a gate task's failing run-list command decides; the task when the command says nothing", () => {
  assert.equal(caughtCategory('pre-push', 'pnpm check:lint'), 'lint');
  assert.equal(caughtCategory('pre-push', 'terraform -chdir=infra/terraform fmt -check'), 'format');
  assert.equal(caughtCategory('pre-merge', 'astro check && astro build'), 'types');
  assert.equal(caughtCategory('test', 'node --run something'), 'tests');
  assert.equal(caughtCategory('pre-push', 'terraform validate'), 'other');
});
