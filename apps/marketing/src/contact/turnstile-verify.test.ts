import { describe, expect, it, vi } from 'vitest';

import { CONTACT_API } from '../constants';
import { verifyTurnstile } from './turnstile-verify';

const input = { token: 'tok', secret: 'sec', remoteIp: '203.0.113.7', hostname: 'nomadware.io' };
const answering = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status }));

describe('verifyTurnstile', () => {
  it('passes on success from the expected hostname', async () => {
    const fetch = answering({ success: true, hostname: 'nomadware.io' });
    expect(await verifyTurnstile(input, fetch)).toBe('passed');
  });

  it('posts secret, token and IP to siteverify', async () => {
    const fetch = answering({ success: true, hostname: 'nomadware.io' });
    await verifyTurnstile(input, fetch);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe(CONTACT_API.turnstileVerifyUrl);
    const body = init?.body;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body instanceof URLSearchParams && Object.fromEntries(body)).toEqual({
      secret: 'sec',
      response: 'tok',
      remoteip: '203.0.113.7',
    });
  });

  it('omits remoteip when the IP is unknown', async () => {
    const fetch = answering({ success: true, hostname: 'nomadware.io' });
    await verifyTurnstile({ ...input, remoteIp: undefined }, fetch);
    const body = fetch.mock.calls[0]?.[1]?.body;
    expect(body instanceof URLSearchParams && body.has('remoteip')).toBe(false);
  });

  it('fails when Cloudflare says no', async () => {
    const fetch = answering({ success: false, 'error-codes': ['invalid-input-response'] });
    expect(await verifyTurnstile(input, fetch)).toBe('failed');
  });

  it('fails a token solved on another hostname', async () => {
    const fetch = answering({ success: true, hostname: 'evil.example' });
    expect(await verifyTurnstile(input, fetch)).toBe('failed');
  });

  it('fails an empty or oversized token without calling Cloudflare', async () => {
    const fetch = answering({ success: true, hostname: 'nomadware.io' });
    expect(await verifyTurnstile({ ...input, token: '' }, fetch)).toBe('failed');
    const huge = 'x'.repeat(CONTACT_API.maxTokenLength + 1);
    expect(await verifyTurnstile({ ...input, token: huge }, fetch)).toBe('failed');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('is unavailable on a 5xx, a network error or a non-JSON body', async () => {
    expect(await verifyTurnstile(input, answering({}, 500))).toBe('unavailable');
    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await verifyTurnstile(input, offline)).toBe('unavailable');
    const garbled = vi.fn<typeof fetch>(async () => new Response('<html>'));
    expect(await verifyTurnstile(input, garbled)).toBe('unavailable');
  });
});
