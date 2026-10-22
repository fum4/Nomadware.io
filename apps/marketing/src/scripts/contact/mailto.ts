import { CONTACT } from '../../constants';
import type { ContactDraft } from './validation';

/** The email draft "send" opens until the form endpoint exists. */
export function mailtoUrl(to: string, { name, email, brief }: ContactDraft): string {
  const subject = `${CONTACT.subjectPrefix}${name.trim()}`;
  const body = `${brief.trim()}\n\n— ${name.trim()} <${email.trim()}>`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
