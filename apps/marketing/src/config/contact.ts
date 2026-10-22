import { TURNSTILE_SITE_KEY } from 'astro:env/client';
import { RESEND_API_KEY, TURNSTILE_HOSTNAME, TURNSTILE_SECRET } from 'astro:env/server';

import type { ContactServerConfig } from '../contact/handle-contact';
import { SITE } from './site';

// The contact form's env, read in one place (schema: astro.config.ts). Set on Vercel by
// infra/terraform/vercel.tf; locally rendered into apps/marketing/.env from
// infra/env/marketing.dev.env (Cloudflare's always-pass test keys, no Resend key).

/** Public Turnstile site key, baked in at build (the build fails without it). */
export const CONTACT_SITE_KEY = TURNSTILE_SITE_KEY;

export type ContactConfigResult =
  | { ok: true; config: ContactServerConfig }
  | { ok: false; missing: string[] };

/**
 * The endpoint's runtime secrets. Missing ones make every request fail loudly (`unconfigured`,
 * logged by name) rather than fall back to anything: the endpoint never half-works.
 */
export function readContactServerConfig(): ContactConfigResult {
  const values = { RESEND_API_KEY, TURNSTILE_SECRET, TURNSTILE_HOSTNAME };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (!RESEND_API_KEY || !TURNSTILE_SECRET || !TURNSTILE_HOSTNAME) return { ok: false, missing };
  return {
    ok: true,
    config: {
      resendApiKey: RESEND_API_KEY,
      turnstileSecret: TURNSTILE_SECRET,
      turnstileHostname: TURNSTILE_HOSTNAME,
      inbox: SITE.email,
    },
  };
}
