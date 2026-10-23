import { CONTACT } from '../../constants';
import type { ContactProblem } from '../../contact/validation';

const count = (value: number): string => value.toLocaleString('en-US');

/** What the terminal says about each problem: the fix, in plain words, with the limit if any. */
const COPY: { [P in ContactProblem as P['field']]: Record<P['kind'], string> } = {
  name: {
    missing: 'add your name',
    too_long: `shorten your name to ${count(CONTACT.maxNameLength)} characters`,
  },
  email: {
    missing: 'add your email',
    invalid: "that email doesn't look right",
  },
  brief: {
    missing: "tell us what you're building",
    too_short: `tell us a bit more about the project (${count(CONTACT.minBriefLength)}+ characters)`,
    too_long: `trim the brief to ${count(CONTACT.maxBriefLength)} characters`,
  },
};

export const PROBLEM_SEPARATOR = ' · ';

const copyOf = (problem: ContactProblem): string => {
  switch (problem.field) {
    case 'name':
      return COPY.name[problem.kind];
    case 'email':
      return COPY.email[problem.kind];
    case 'brief':
      return COPY.brief[problem.kind];
  }
};

/** One terminal line naming only what's wrong, in form order; empty when nothing is. */
export const problemMessage = (problems: readonly ContactProblem[]): string =>
  problems.map(copyOf).join(PROBLEM_SEPARATOR);
