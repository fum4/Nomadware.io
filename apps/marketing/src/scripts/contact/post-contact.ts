import { CONTACT } from '../../constants';
import type { ContactRequest } from '../../contact/contact-api';

/** Posts a submission; true only when the endpoint confirms it. Never throws. */
export async function postContact(request: ContactRequest): Promise<boolean> {
  try {
    const response = await fetch(CONTACT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.ok;
  } catch {
    return false;
  }
}
