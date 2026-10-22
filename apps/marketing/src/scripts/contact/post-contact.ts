import { CONTACT } from '../../constants';
import type { ContactCode, ContactRequest } from '../../contact/contact-api';
import { isContactCode } from '../../contact/contact-api';

/** Why a post didn't send: the endpoint's own code, or `network` / `server` when it gave none. */
export type PostFailure = Exclude<ContactCode, 'sent'> | 'network' | 'server';

export type PostResult = { sent: true } | { sent: false; reason: PostFailure };

async function failureOf(response: Response): Promise<PostFailure> {
  const body: unknown = await response.json().catch(() => null);
  const code = typeof body === 'object' && body !== null && 'code' in body ? body.code : null;
  return isContactCode(code) && code !== 'sent' ? code : 'server';
}

/** Posts a submission; `sent` only when the endpoint confirms it. Never throws. */
export async function postContact(request: ContactRequest): Promise<PostResult> {
  try {
    const response = await fetch(CONTACT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.ok ? { sent: true } : { sent: false, reason: await failureOf(response) };
  } catch {
    return { sent: false, reason: 'network' };
  }
}
