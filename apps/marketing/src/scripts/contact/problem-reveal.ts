import { contactProblems } from '../../contact/validation';
import type { ContactDraft, ContactField, ContactProblem } from '../../contact/validation';

/**
 * Which problems the form speaks about. Nothing while the visitor types a first value; a field
 * they leave with something wrong in it (a malformed email, a too-short brief, never just empty);
 * everything once they try to send. Once a field is revealed it stays live: fixing it drops it from
 * the line at once, breaking it again brings it back.
 */
export interface Reveal {
  readonly attempted: boolean;
  readonly left: readonly ContactField[];
}

export const QUIET: Reveal = { attempted: false, left: [] };

/** A send attempt: from now on every problem shows. */
export const revealAll = (reveal: Reveal): Reveal =>
  reveal.attempted ? reveal : { ...reveal, attempted: true };

/** The visitor left `field`: it speaks up if what's in it is wrong (empty doesn't count). */
export function revealField(reveal: Reveal, field: ContactField, draft: ContactDraft): Reveal {
  if (reveal.attempted || reveal.left.includes(field)) return reveal;
  const wrong = contactProblems(draft).some(
    (problem) => problem.field === field && problem.kind !== 'missing',
  );
  return wrong ? { ...reveal, left: [...reveal.left, field] } : reveal;
}

/** The problems to show now, in form order. */
export const shownProblems = (draft: ContactDraft, reveal: Reveal): ContactProblem[] =>
  contactProblems(draft).filter(
    (problem) => reveal.attempted || reveal.left.includes(problem.field),
  );
