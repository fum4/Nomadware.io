import { afterEach, describe, expect, it, vi } from 'vitest';

import { postContact } from './post-contact';

const REQUEST = { name: 'n', email: 'e@x.io', brief: 'brief', website: '', token: 't' };

const respond = (status: number, body: unknown): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postContact', () => {
  it('is sent on a 2xx', async () => {
    respond(200, { ok: true, code: 'sent' });
    expect(await postContact(REQUEST)).toEqual({ sent: true });
  });

  it("carries the endpoint's code as the reason", async () => {
    respond(429, { ok: false, code: 'rate_limited' });
    expect(await postContact(REQUEST)).toEqual({ sent: false, reason: 'rate_limited' });
  });

  it('falls back to server for a body without a known code', async () => {
    respond(502, { message: 'bad gateway' });
    expect(await postContact(REQUEST)).toEqual({ sent: false, reason: 'server' });
    respond(500, { ok: false, code: 'sent' });
    expect(await postContact(REQUEST)).toEqual({ sent: false, reason: 'server' });
  });

  it('is network when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );
    expect(await postContact(REQUEST)).toEqual({ sent: false, reason: 'network' });
  });
});
