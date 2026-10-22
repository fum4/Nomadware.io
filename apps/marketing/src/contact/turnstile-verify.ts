import { CONTACT_API } from '../constants';
import { readField } from './read-field';

export type TurnstileVerdict = 'passed' | 'failed' | 'unavailable';

interface VerifyInput {
  token: string;
  secret: string;
  /** The visitor's IP, passed on to Cloudflare as an extra signal; omitted when unknown. */
  remoteIp: string | undefined;
  /** The hostname the widget must have been solved on (a token from elsewhere is refused). */
  hostname: string;
}

/**
 * Server-side Turnstile check (siteverify). `failed` = Cloudflare says no, or the token was solved
 * on another hostname; `unavailable` = we couldn't get an answer (network, timeout, 5xx).
 */
export async function verifyTurnstile(
  { token, secret, remoteIp, hostname }: VerifyInput,
  fetchImpl: typeof fetch,
): Promise<TurnstileVerdict> {
  if (token.length === 0 || token.length > CONTACT_API.maxTokenLength) return 'failed';
  const form = new URLSearchParams({ secret, response: token });
  if (remoteIp) form.set('remoteip', remoteIp);

  let body: unknown;
  try {
    const response = await fetchImpl(CONTACT_API.turnstileVerifyUrl, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(CONTACT_API.upstreamTimeoutMs),
    });
    if (!response.ok) return 'unavailable';
    body = await response.json();
  } catch {
    return 'unavailable';
  }
  return readField(body, 'success') === true && readField(body, 'hostname') === hostname
    ? 'passed'
    : 'failed';
}
