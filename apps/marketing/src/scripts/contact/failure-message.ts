import { SITE } from '../../config/site';
import type { PostFailure } from './post-contact';

/** Why "send" didn't go through after the form was valid: no Turnstile token, or the post. */
export type SendFailure = PostFailure | 'turnstile';

/**
 * The visitor's line for a failed send. Only causes they can act on get their own words (offline,
 * sending too often, the spam check); everything else is one line. Every one offers the address.
 */
export function failureMessage(reason: SendFailure): string {
  const fallback = `or write to ${SITE.email}`;
  switch (reason) {
    case 'network':
      return `couldn't reach us — check your connection and try again, ${fallback}`;
    case 'rate_limited':
      return `too many sends from here — try again later, ${fallback}`;
    case 'turnstile':
    case 'challenge_failed':
      return `the spam check didn't pass — reload the page and try again, ${fallback}`;
    default:
      return `couldn't send — try again ${fallback}`;
  }
}
