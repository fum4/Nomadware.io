import { CONTACT_API } from '../constants';
import type { ContactCode } from './contact-api';
import { emailMessage } from './email-message';
import type { RateLimiter } from './rate-limiter';
import { readField } from './read-field';
import { sendWithResend } from './resend-send';
import { verifyTurnstile } from './turnstile-verify';
import { cleanDraft } from './validation';

/** Everything the endpoint needs at runtime; read from env by src/config/contact.ts. */
export interface ContactServerConfig {
  resendApiKey: string;
  turnstileSecret: string;
  turnstileHostname: string;
  /** Where submissions go. */
  inbox: string;
}

export interface ContactDeps {
  config: ContactServerConfig;
  limiter: RateLimiter;
  fetch: typeof fetch;
}

export interface ContactInput {
  /** The raw request body (already size-checked by the route). */
  body: string;
  /** The visitor's IP: the rate-limit key and a siteverify signal; undefined when unknown. */
  ip: string | undefined;
}

/** The outcome, plus non-identifying detail for the log (never names, addresses or the brief). */
export interface ContactOutcome {
  status: number;
  code: ContactCode;
  upstreamStatus?: number | null;
  /** The honeypot caught it: answered like a send, nothing sent. */
  trapped?: true;
}

const STATUS: Record<ContactCode, number> = {
  sent: 200,
  bad_request: 400,
  too_large: 413,
  invalid: 422,
  rate_limited: 429,
  challenge_failed: 403,
  challenge_unavailable: 502,
  send_failed: 502,
  unconfigured: 503,
};

/** The outcome for `code`, with its one HTTP status. */
export const contactOutcome = (
  code: ContactCode,
  upstreamStatus?: number | null,
): ContactOutcome =>
  upstreamStatus === undefined
    ? { status: STATUS[code], code }
    : { status: STATUS[code], code, upstreamStatus };

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function parseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/**
 * One contact submission, start to finish: parse → rate limit → honeypot → validate → Turnstile →
 * send. A filled honeypot gets the same 200 as a real send, so a bot learns nothing.
 */
export async function handleContact(
  { body, ip }: ContactInput,
  { config, limiter, fetch }: ContactDeps,
): Promise<ContactOutcome> {
  if (new TextEncoder().encode(body).byteLength > CONTACT_API.maxBodyBytes)
    return contactOutcome('too_large');
  const payload = parseBody(body);
  const [name, email, brief, website, token] = ['name', 'email', 'brief', 'website', 'token'].map(
    (key) => asString(readField(payload, key)),
  );
  if (name == null || email == null || brief == null || website == null || token == null) {
    return contactOutcome('bad_request');
  }

  if (!limiter.allow(ip ?? 'unknown')) return contactOutcome('rate_limited');
  if (website.length > 0) return { status: STATUS.sent, code: 'sent', trapped: true };

  const draft = cleanDraft({ name, email, brief });
  if (!draft) return contactOutcome('invalid');

  const verdict = await verifyTurnstile(
    { token, secret: config.turnstileSecret, remoteIp: ip, hostname: config.turnstileHostname },
    fetch,
  );
  if (verdict === 'failed') return contactOutcome('challenge_failed');
  if (verdict === 'unavailable') return contactOutcome('challenge_unavailable');

  const result = await sendWithResend(
    {
      apiKey: config.resendApiKey,
      to: config.inbox,
      replyTo: draft.email,
      message: emailMessage(draft),
    },
    fetch,
  );
  return result.sent ? contactOutcome('sent') : contactOutcome('send_failed', result.status);
}
