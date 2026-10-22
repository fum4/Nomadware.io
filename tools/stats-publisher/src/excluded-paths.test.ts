import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isExcludedPath } from './excluded-paths.ts';

test('excludes lockfiles, generated code, build output, minified files, snapshots', () => {
  for (const path of [
    'pnpm-lock.yaml',
    'apps/web/package-lock.json',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
    'crates/x/Cargo.lock',
    'go.sum',
    'infra/terraform/.terraform.lock.hcl',
    'mise.lock',
    'apps/site/dist/index.html',
    'packages/api/build/server.js',
    'src/generated/schema.ts',
    'src/__generated__/graphql.ts',
    'src/routes.gen.ts',
    'public/vendor.min.js',
    'src/__snapshots__/a.test.ts.snap',
    'drizzle/meta/0007_snapshot.json',
  ]) {
    assert.equal(isExcludedPath(path), true, path);
  }
});

test('keeps source, config and docs', () => {
  for (const path of [
    'src/index.ts',
    'package.json',
    'README.md',
    'apps/web/src/build-info.ts',
    'src/distance.ts',
    'docs/locking.md',
    'src/generator.ts',
  ]) {
    assert.equal(isExcludedPath(path), false, path);
  }
});
