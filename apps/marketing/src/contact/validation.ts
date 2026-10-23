import { CONTACT } from '../constants';

// The contact form's rules, shared by the browser (readiness, the problems line) and the endpoint
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

/** The draft's fields, in the order the form shows them. */
export const CONTACT_FIELDS = ['name', 'email', 'brief'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** What can be wrong with each field; one problem per field at most. */
export type ContactProblem =
  | { field: 'name'; kind: 'missing' | 'too_long' }
  | { field: 'email'; kind: 'missing' | 'invalid' }
  | { field: 'brief'; kind: 'missing' | 'too_short' | 'too_long' };

function nameProblem(value: string): ContactProblem | null {
  const name = cleanLine(value);
  if (name.length === 0) return { field: 'name', kind: 'missing' };
  if (name.length > CONTACT.maxNameLength) return { field: 'name', kind: 'too_long' };
  return null;
}

function emailProblem(value: string): ContactProblem | null {
  if (cleanLine(value).length === 0) return { field: 'email', kind: 'missing' };
  return isEmail(value) ? null : { field: 'email', kind: 'invalid' };
}

function briefProblem(value: string): ContactProblem | null {
  const brief = cleanText(value);
  if (brief.length === 0) return { field: 'brief', kind: 'missing' };
  if (brief.length < CONTACT.minBriefLength) return { field: 'brief', kind: 'too_short' };
  if (brief.length > CONTACT.maxBriefLength) return { field: 'brief', kind: 'too_long' };
  return null;
}

/** Everything wrong with a draft, in field order; empty when it can be sent. */
export const contactProblems = ({ name, email, brief }: ContactDraft): ContactProblem[] =>
  [nameProblem(name), emailProblem(email), briefProblem(brief)].filter(
    (problem): problem is ContactProblem => problem !== null,
  );

export const isComplete = (draft: ContactDraft): boolean => contactProblems(draft).length === 0;

/** The cleaned draft, or null when any field breaks the rules. */
export function cleanDraft(draft: ContactDraft): ContactDraft | null {
  if (!isComplete(draft)) return null;
  return {
    name: cleanLine(draft.name),
    email: cleanLine(draft.email),
    brief: cleanText(draft.brief),
  };
}
