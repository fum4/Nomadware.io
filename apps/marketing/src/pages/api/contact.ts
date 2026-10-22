import type { APIRoute } from 'astro';

import { readContactServerConfig } from '../../config/contact';
import { CONTACT_API } from '../../constants';
import type { ContactResponse } from '../../contact/contact-api';
import { contactOutcome, handleContact } from '../../contact/handle-contact';
import type { ContactOutcome } from '../../contact/handle-contact';
import { createRateLimiter } from '../../contact/rate-limiter';
import { logEvent } from '../../log/log-event';

// POST /api/contact — the contact form's endpoint, the site's one on-demand route.
export const prerender = false;

// Module scope: lives as long as the warm function instance (see rate-limiter.ts).
const limiter = createRateLimiter({
  max: CONTACT_API.rateLimitMax,
  windowMs: CONTACT_API.rateLimitWindowMs,
  maxTracked: CONTACT_API.rateLimitMaxTracked,
});

const reply = ({ status, code }: ContactOutcome): Response =>
  Response.json({ ok: status < 300, code } satisfies ContactResponse, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

function log(outcome: ContactOutcome): void {
  const level = outcome.status >= 500 ? 'error' : outcome.status >= 400 ? 'warn' : 'info';
  logEvent(level, 'contact.submission', {
    code: outcome.code,
    status: outcome.status,
    trapped: outcome.trapped ?? false,
    upstreamStatus: outcome.upstreamStatus ?? null,
  });
}

function clientIp(read: () => string): string | undefined {
  try {
    return read() || undefined;
  } catch {
    return undefined;
  }
}

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > CONTACT_API.maxBodyBytes) {
    const outcome = contactOutcome('too_large');
    log(outcome);
    return reply(outcome);
  }

  const env = readContactServerConfig();
  if (!env.ok) {
    logEvent('error', 'contact.unconfigured', { missing: env.missing.join(',') });
    return reply(contactOutcome('unconfigured'));
  }

  const outcome = await handleContact(
    // clientAddress is a getter that throws where the platform gives no address.
    { body: await request.text(), ip: clientIp(() => context.clientAddress) },
    { config: env.config, limiter, fetch },
  );
  log(outcome);
  return reply(outcome);
};
