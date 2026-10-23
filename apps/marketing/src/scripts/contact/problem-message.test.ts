import { describe, expect, it } from 'vitest';

import { CONTACT } from '../../constants';
import { contactProblems } from '../../contact/validation';
import { problemMessage } from './problem-message';

const valid = { name: 'Ada Lovelace', email: 'ada@example.com', brief: 'An engine for numbers.' };
const say = (draft: Partial<typeof valid>): string =>
  problemMessage(contactProblems({ ...valid, ...draft }));

describe('problemMessage', () => {
  it('is empty when nothing is wrong', () => expect(say({})).toBe(''));

  it('names every missing field, in form order', () => {
    expect(say({ name: '', email: '', brief: '' })).toBe(
      "add your name · add your email · tell us what you're building",
    );
  });

  it('says only what is wrong', () => {
    expect(say({ name: '' })).toBe('add your name');
    expect(say({ email: '' })).toBe('add your email');
    expect(say({ brief: '' })).toBe("tell us what you're building");
    expect(say({ email: '', brief: '' })).toBe("add your email · tell us what you're building");
  });

  it('tells a malformed email from a missing one', () => {
    expect(say({ email: 'ada@example' })).toBe("that email doesn't look right");
  });

  it('names the limits from CONTACT', () => {
    expect(say({ brief: 'abc' })).toBe(`the brief needs ${CONTACT.minBriefLength}+ characters`);
    expect(say({ brief: 'x'.repeat(CONTACT.maxBriefLength + 1) })).toBe(
      'trim the brief to 4,000 characters',
    );
    expect(say({ name: 'x'.repeat(CONTACT.maxNameLength + 1) })).toBe(
      'shorten your name to 120 characters',
    );
  });

  it('mixes kinds in one line', () => {
    expect(say({ name: '', email: 'nope', brief: 'ab' })).toBe(
      "add your name · that email doesn't look right · the brief needs 4+ characters",
    );
  });
});
