import { describe, expect, it } from 'vitest';

import { SITE } from '../../config/site';
import { failureMessage } from './failure-message';
import type { SendFailure } from './failure-message';

describe('failureMessage', () => {
  it.each<[SendFailure, string]>([
    ['network', "couldn't reach us — check your connection and try again"],
    ['rate_limited', 'too many sends from here — try again later'],
    ['turnstile', "the spam check didn't pass — reload the page and try again"],
    ['challenge_failed', "the spam check didn't pass — reload the page and try again"],
    ['challenge_unavailable', "couldn't send — try again"],
    ['send_failed', "couldn't send — try again"],
    ['unconfigured', "couldn't send — try again"],
    ['invalid', "couldn't send — try again"],
    ['server', "couldn't send — try again"],
  ])('%s → %s', (reason, start) => {
    const message = failureMessage(reason);
    expect(message.startsWith(start)).toBe(true);
    expect(message.endsWith(`write to ${SITE.email}`)).toBe(true);
  });
});
