// The wire contract between the contact form and POST /api/contact, shared by both sides.

/** What the form posts. `website` is the honeypot: people never see it, so it stays empty. */
export interface ContactRequest {
  name: string;
  email: string;
  brief: string;
  website: string;
  token: string;
}

/**
 * Why a submission ended the way it did. The response carries it for logs and tests; the form
 * never shows a code, it words the few a visitor can act on (scripts/contact/failure-message.ts).
 */
export const CONTACT_CODES = [
  'sent',
  'bad_request',
  'too_large',
  'invalid',
  'rate_limited',
  'challenge_failed',
  'challenge_unavailable',
  'send_failed',
  'unconfigured',
] as const;
export type ContactCode = (typeof CONTACT_CODES)[number];

export const isContactCode = (value: unknown): value is ContactCode =>
  CONTACT_CODES.some((code) => code === value);

export interface ContactResponse {
  ok: boolean;
  code: ContactCode;
}
