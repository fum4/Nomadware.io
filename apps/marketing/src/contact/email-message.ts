import { CONTACT } from '../constants';
import type { ContactDraft } from './validation';

export interface EmailMessage {
  subject: string;
  text: string;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

/** The email a submission becomes: plain text, plus a minimal HTML twin with every value escaped. */
export function emailMessage({ name, email, brief }: ContactDraft): EmailMessage {
  const signature = `— ${name} <${email}>`;
  return {
    subject: `${CONTACT.subjectPrefix}${name}`,
    text: `${brief}\n\n${signature}`,
    html:
      `<p style="white-space:pre-wrap">${escapeHtml(brief)}</p>` +
      `<p>${escapeHtml(signature)}</p>`,
  };
}
