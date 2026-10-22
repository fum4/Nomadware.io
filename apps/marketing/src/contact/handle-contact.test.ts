import { describe, expect, it, vi } from 'vitest';

import { CONTACT_API } from '../constants';
import type { ContactRequest } from './contact-api';
import { handleContact } from './handle-contact';
import type { ContactDeps } from './handle-contact';
import { createRateLimiter } from './rate-limiter';

const config = {
  resendApiKey: 're_test',
  turnstileSecret: 'ts_secret',
  turnstileHostname: 'nomadware.io',
  inbox: 'contact@nomadware.io',
};
const request: ContactRequest = {
  name: 'Ada',
  email: 'ada@example.com',
  brief: 'An engine for numbers.',
  website: '',
  token: 'tok',
};

/** A fetch that answers siteverify and Resend as told, recording every call. */
function upstreams({ challenge = true, resendStatus = 200 } = {}) {
  return vi.fn<typeof fetch>(async (url) => {
    if (url === CONTACT_API.turnstileVerifyUrl) {
      return Response.json({ success: challenge, hostname: 'nomadware.io' });
    }
    return Response.json({ id: 'email_1' }, { status: resendStatus });
  });
}

function deps(fetch = upstreams()): ContactDeps {
  return {
    config,
    fetch,
    limiter: createRateLimiter({
      max: CONTACT_API.rateLimitMax,
      windowMs: CONTACT_API.rateLimitWindowMs,
      maxTracked: 100,
    }),
  };
}

const submit = (body: unknown, d: ContactDeps, ip = '203.0.113.7') =>
  handleContact({ body: typeof body === 'string' ? body : JSON.stringify(body), ip }, d);

const resendCall = (fetch: ReturnType<typeof upstreams>) =>
  fetch.mock.calls.find(([url]) => url === CONTACT_API.resendSendUrl);

describe('handleContact', () => {
  it('verifies, then sends through Resend with reply-to the visitor', async () => {
    const fetch = upstreams();
    expect(await submit(request, deps(fetch))).toEqual({ status: 200, code: 'sent' });

    const [, init] = resendCall(fetch) ?? [];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer re_test' });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: CONTACT_API.from,
      to: ['contact@nomadware.io'],
      reply_to: 'ada@example.com',
      subject: 'New project — Ada',
    });
  });

  it('answers a filled honeypot like a send, and sends nothing', async () => {
    const fetch = upstreams();
    const outcome = await submit({ ...request, website: 'https://spam.example' }, deps(fetch));
    expect(outcome).toEqual({ status: 200, code: 'sent', trapped: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a failed challenge without sending', async () => {
    const fetch = upstreams({ challenge: false });
    expect(await submit(request, deps(fetch))).toEqual({ status: 403, code: 'challenge_failed' });
    expect(resendCall(fetch)).toBeUndefined();
  });

  it('reports an unreachable siteverify as challenge_unavailable', async () => {
    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await submit(request, deps(offline))).toEqual({
      status: 502,
      code: 'challenge_unavailable',
    });
  });

  it('reports a Resend rejection with its status', async () => {
    const outcome = await submit(request, deps(upstreams({ resendStatus: 401 })));
    expect(outcome).toEqual({ status: 502, code: 'send_failed', upstreamStatus: 401 });
  });

  it('rejects invalid fields before any upstream call', async () => {
    const fetch = upstreams();
    expect(await submit({ ...request, email: 'nope' }, deps(fetch))).toEqual({
      status: 422,
      code: 'invalid',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([['not json'], [{ ...request, token: 42 }], [{ name: 'Ada' }], [null]])(
    'rejects a malformed body %j',
    async (body) => {
      expect(await submit(body, deps())).toEqual({ status: 400, code: 'bad_request' });
    },
  );

  it('refuses an oversized body', async () => {
    const big = { ...request, brief: 'x'.repeat(CONTACT_API.maxBodyBytes) };
    expect(await submit(big, deps())).toEqual({ status: 413, code: 'too_large' });
  });

  it('rate-limits per IP', async () => {
    const d = deps();
    for (let i = 0; i < CONTACT_API.rateLimitMax; i += 1) {
      // oxlint-disable-next-line no-await-in-loop -- attempts must land in order
      expect((await submit(request, d)).code).toBe('sent');
    }
    expect(await submit(request, d)).toEqual({ status: 429, code: 'rate_limited' });
    expect((await submit(request, d, '198.51.100.1')).code).toBe('sent');
  });
});
