import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRoutes, resolve, type Output } from './routes.ts';

// Shaped like the config.json `vercel build` emits for apps/marketing (vercel.json merged in).
const phases = parseRoutes([
  {
    src: '^/_astro(?:/(.*))$',
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    continue: true,
  },
  { src: '^/sitemap\\.xml$', headers: { Location: '/sitemap-index.xml' }, status: 308 },
  { handle: 'filesystem' },
  {
    src: '^/ingest/static(?:/(.*))$',
    dest: 'https://eu-assets.i.posthog.com/static/$1',
    check: true,
  },
  { src: '^/ingest(?:/(.*))$', dest: 'https://eu.i.posthog.com/$1', check: true },
  { src: '^/api/contact/?$', dest: '_render' },
  { src: '^/.*$', dest: '_render' },
  { handle: 'error' },
  { status: 404, src: '^(?!/api).*$', dest: '/404.html' },
]);

const output: Output = {
  hasFile: (path) => ['/index.html', '/_astro/app.js', '/404.html'].includes(path),
  hasFunction: (name) => name === '_render',
};

test('serves static files, directory index included', () => {
  assert.deepEqual(resolve(phases, '/', '', output), {
    kind: 'file',
    path: '/index.html',
    status: 200,
    headers: {},
  });
});

test('applies a continue route’s headers to the file it falls through to', () => {
  const result = resolve(phases, '/_astro/app.js', '', output);
  assert.equal(result.kind, 'file');
  assert.equal(result.headers['cache-control'], 'public, max-age=31536000, immutable');
});

test('answers a redirect route with its status and Location', () => {
  assert.deepEqual(resolve(phases, '/sitemap.xml', '', output), {
    kind: 'status',
    status: 308,
    headers: { location: '/sitemap-index.xml' },
  });
});

test('proxies external rewrites with the captured path and the query', () => {
  assert.deepEqual(resolve(phases, '/ingest/static/array.js', '?v=1', output), {
    kind: 'proxy',
    url: 'https://eu-assets.i.posthog.com/static/array.js?v=1',
    headers: {},
  });
  const capture = resolve(phases, '/ingest/e/', '?ip=0', output);
  assert.deepEqual(capture, {
    kind: 'proxy',
    url: 'https://eu.i.posthog.com/e/?ip=0',
    headers: {},
  });
});

test('routes on-demand paths, unknown ones included, to the function', () => {
  assert.equal(resolve(phases, '/api/contact', '', output).kind, 'function');
  assert.equal(resolve(phases, '/no-such-page', '', output).kind, 'function');
});

test('falls back to the error phase when nothing matches', () => {
  const bare = parseRoutes([{ handle: 'filesystem' }, { handle: 'error' }, ...errorRoutes()]);
  assert.deepEqual(resolve(bare, '/missing', '', output), {
    kind: 'file',
    path: '/404.html',
    status: 404,
    headers: {},
  });
  assert.equal(resolve(bare, '/api/missing', '', output).kind, 'status');
});

test('refuses route features it does not implement', () => {
  assert.throws(() => parseRoutes([{ handle: 'hit' }]), /unsupported handle/);
  assert.throws(
    () => parseRoutes([{ src: '^/$', has: [] } as unknown as { src: string }]),
    /unsupported route key/,
  );
});

function errorRoutes() {
  return [{ status: 404, src: '^(?!/api).*$', dest: '/404.html' }];
}
