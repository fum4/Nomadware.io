import { CONTACT } from '../constants';

// The contact form's rules, shared by the browser (readiness, the email hint) and the endpoint
// (the authority). One home, so the two can't disagree about what a valid submission is.

/** Something before the @, a dot-separated domain after it, no whitespace anywhere. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
/** C0 controls and DEL, except tab and newline (kept in the brief). */
// oxlint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
// oxlint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_ALL = /[\u0000-\u001F\u007F]/g;

export interface ContactDraft {
  name: string;
  email: string;
  brief: string;
}

/** A single-line value: every control character (newlines too) removed, trimmed. */
export const cleanLine = (value: string): string => value.replace(CONTROL_ALL, '').trim();

/** The brief: CRLF normalised, controls but tab/newline removed, trimmed. */
export const cleanText = (value: string): string =>
  value.replace(/\r\n?/g, '\n').replace(CONTROL_EXCEPT_TAB_NEWLINE, '').trim();

export const isEmail = (value: string): boolean => {
  const email = cleanLine(value);
  return email.length <= CONTACT.maxEmailLength && EMAIL_PATTERN.test(email);
};

const isName = (value: string): boolean => {
  const name = cleanLine(value);
  return name.length > 0 && name.length <= CONTACT.maxNameLength;
};

const isBrief = (value: string): boolean => {
  const brief = cleanText(value);
  return brief.length >= CONTACT.minBriefLength && brief.length <= CONTACT.maxBriefLength;
};

export const isComplete = ({ name, email, brief }: ContactDraft): boolean =>
  isName(name) && isEmail(email) && isBrief(brief);

/** The cleaned draft, or null when any field breaks the rules. */
export function cleanDraft(draft: ContactDraft): ContactDraft | null {
  if (!isComplete(draft)) return null;
  return {
    name: cleanLine(draft.name),
    email: cleanLine(draft.email),
    brief: cleanText(draft.brief),
  };
}
