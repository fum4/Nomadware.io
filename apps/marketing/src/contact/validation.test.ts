import { describe, expect, it } from 'vitest';

import { CONTACT } from '../constants';
import { cleanDraft, contactProblems, isComplete, isEmail } from './validation';

const valid = { name: 'Ada Lovelace', email: 'ada@example.com', brief: 'An engine for numbers.' };

describe('isEmail', () => {
  it.each(['ada@example.com', 'a.b+tag@sub.example.co.uk', '  ada@example.com  '])(
    'accepts %s',
    (email) => expect(isEmail(email)).toBe(true),
  );

  it.each([
    '',
    'ada',
    'ada@',
    '@example.com',
    'ada@example',
    'ada@@example.com',
    'a da@x.com',
    'ada@x..com',
  ])('rejects %j', (email) => expect(isEmail(email)).toBe(false));

  it('rejects an address over the length cap', () => {
    const local = 'a'.repeat(CONTACT.maxEmailLength);
    expect(isEmail(`${local}@example.com`)).toBe(false);
  });
});

describe('isComplete', () => {
  it('accepts a valid draft', () => expect(isComplete(valid)).toBe(true));

  it('needs a name within the cap', () => {
    expect(isComplete({ ...valid, name: '   ' })).toBe(false);
    expect(isComplete({ ...valid, name: 'x'.repeat(CONTACT.maxNameLength) })).toBe(true);
    expect(isComplete({ ...valid, name: 'x'.repeat(CONTACT.maxNameLength + 1) })).toBe(false);
  });

  it('needs a brief between the bounds', () => {
    expect(isComplete({ ...valid, brief: 'abc' })).toBe(false);
    expect(isComplete({ ...valid, brief: 'abcd' })).toBe(true);
    expect(isComplete({ ...valid, brief: 'x'.repeat(CONTACT.maxBriefLength) })).toBe(true);
    expect(isComplete({ ...valid, brief: 'x'.repeat(CONTACT.maxBriefLength + 1) })).toBe(false);
  });

  it('counts the brief after control characters are stripped', () => {
    expect(isComplete({ ...valid, brief: 'ab\u0000\u0007c' })).toBe(false);
  });
});

const kinds = (draft: typeof valid): string[] =>
  contactProblems(draft).map(({ field, kind }) => `${field}:${kind}`);

describe('contactProblems', () => {
  it('is empty for a valid draft', () => expect(contactProblems(valid)).toEqual([]));

  it('lists every field, in form order, when all are empty', () => {
    expect(kinds({ name: '', email: '', brief: '' })).toEqual([
      'name:missing',
      'email:missing',
      'brief:missing',
    ]);
  });

  it('counts whitespace and control characters as missing', () => {
    expect(kinds({ name: ' \u0000 ', email: '  ', brief: '\n\t ' })).toEqual([
      'name:missing',
      'email:missing',
      'brief:missing',
    ]);
  });

  it('tells a malformed email from a missing one', () => {
    expect(kinds({ ...valid, email: 'ada@' })).toEqual(['email:invalid']);
    expect(kinds({ ...valid, email: 'a'.repeat(CONTACT.maxEmailLength) + '@x.io' })).toEqual([
      'email:invalid',
    ]);
  });

  it('tells a short or long brief from a missing one', () => {
    expect(kinds({ ...valid, brief: 'abc' })).toEqual(['brief:too_short']);
    expect(kinds({ ...valid, brief: 'x'.repeat(CONTACT.maxBriefLength + 1) })).toEqual([
      'brief:too_long',
    ]);
  });

  it('flags a name over the cap', () => {
    expect(kinds({ ...valid, name: 'x'.repeat(CONTACT.maxNameLength + 1) })).toEqual([
      'name:too_long',
    ]);
  });

  it('names only the broken fields', () => {
    expect(kinds({ ...valid, name: '', brief: 'ab' })).toEqual(['name:missing', 'brief:too_short']);
  });
});

describe('cleanDraft', () => {
  it('strips control characters: all of them from lines, all but tab/newline from the brief', () => {
    const cleaned = cleanDraft({
      name: ' Ada\r\nBcc: evil@x.com\u0000 ',
      email: 'ada@example.com\u0007',
      brief: 'line one\r\nline\ttwo\u0000\u001b[31m',
    });
    expect(cleaned).toEqual({
      name: 'AdaBcc: evil@x.com',
      email: 'ada@example.com',
      brief: 'line one\nline\ttwo[31m',
    });
  });

  it('returns null for an invalid draft', () => {
    expect(cleanDraft({ ...valid, email: 'nope' })).toBeNull();
  });
});
