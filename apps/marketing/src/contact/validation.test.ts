import { describe, expect, it } from 'vitest';

import { CONTACT } from '../constants';
import { cleanDraft, isComplete, isEmail } from './validation';

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
