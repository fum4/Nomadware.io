import { describe, expect, it } from 'vitest';

import type { ContactDraft } from '../../contact/validation';
import { problemMessage } from './problem-message';
import { QUIET, revealAll, revealField, shownProblems } from './problem-reveal';

const EMPTY: ContactDraft = { name: '', email: '', brief: '' };
const shown = (draft: ContactDraft, reveal = QUIET): string =>
  problemMessage(shownProblems(draft, reveal));

describe('before a send attempt', () => {
  it('says nothing about an untouched or half-typed form', () => {
    expect(shown(EMPTY)).toBe('');
    expect(shown({ ...EMPTY, email: 'ada@' })).toBe('');
  });

  it('leaving an empty field reveals nothing', () => {
    expect(revealField(QUIET, 'name', EMPTY)).toBe(QUIET);
    expect(revealField(QUIET, 'email', EMPTY)).toBe(QUIET);
  });

  it('leaving a valid field reveals nothing', () => {
    expect(revealField(QUIET, 'email', { ...EMPTY, email: 'ada@example.com' })).toBe(QUIET);
  });

  it('leaving a wrong field reveals that field only', () => {
    const draft = { ...EMPTY, email: 'ada@' };
    const reveal = revealField(QUIET, 'email', draft);
    expect(shown(draft, reveal)).toBe("that email doesn't look right");
  });

  it('a revealed field stays live: fixed drops out, broken again comes back', () => {
    const reveal = revealField(QUIET, 'brief', { ...EMPTY, brief: 'ab' });
    expect(shown({ ...EMPTY, brief: 'ab' }, reveal)).toBe(
      'tell us a bit more about the project (40+ characters)',
    );
    expect(
      shown({ ...EMPTY, brief: 'A booking app for clinics, with payments and reminders.' }, reveal),
    ).toBe('');
    expect(shown({ ...EMPTY, brief: '' }, reveal)).toBe("tell us what you're building");
  });
});

describe('after a send attempt', () => {
  it('names everything wrong, and shrinks live as each field is fixed', () => {
    const reveal = revealAll(QUIET);
    const steps: Array<[ContactDraft, string]> = [
      [EMPTY, "add your name · add your email · tell us what you're building"],
      [{ ...EMPTY, name: 'Ada' }, "add your email · tell us what you're building"],
      [
        { ...EMPTY, name: 'Ada', email: 'ada@' },
        "that email doesn't look right · tell us what you're building",
      ],
      [{ name: 'Ada', email: 'ada@example.com', brief: '' }, "tell us what you're building"],
      [
        { name: 'Ada', email: 'ada@example.com', brief: 'ab' },
        'tell us a bit more about the project (40+ characters)',
      ],
      [
        {
          name: 'Ada',
          email: 'ada@example.com',
          brief: 'A booking app for clinics, with payments and reminders.',
        },
        '',
      ],
    ];
    steps.forEach(([draft, message]) => expect(shown(draft, reveal)).toBe(message));
  });

  it('is idempotent and makes per-field reveals moot', () => {
    const reveal = revealAll(QUIET);
    expect(revealAll(reveal)).toBe(reveal);
    expect(revealField(reveal, 'email', { ...EMPTY, email: 'x' })).toBe(reveal);
  });

  it('a fresh form after a send is quiet again', () => {
    expect(shown(EMPTY, QUIET)).toBe('');
  });
});
