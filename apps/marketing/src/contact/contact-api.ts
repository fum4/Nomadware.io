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
 * Why a submission ended the way it did. Internal: the response carries it for logs and tests,
 * the form never shows it (every failure reads the same to the visitor).
 */
export type ContactCode =
  | 'sent'
  | 'bad_request'
  | 'too_large'
  | 'invalid'
  | 'rate_limited'
  | 'challenge_failed'
  | 'challenge_unavailable'
  | 'send_failed'
  | 'unconfigured';

export interface ContactResponse {
  ok: boolean;
  code: ContactCode;
}
