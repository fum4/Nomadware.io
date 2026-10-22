import { describe, expect, it } from 'vitest';

import { createRateLimiter } from './rate-limiter';

function setup(maxTracked = 100) {
  let clock = 0;
  const limiter = createRateLimiter({ max: 2, windowMs: 1000, maxTracked, now: () => clock });
  return { limiter, advance: (ms: number) => (clock += ms) };
}

describe('createRateLimiter', () => {
  it('allows up to max per window, per key', () => {
    const { limiter } = setup();
    expect([limiter.allow('a'), limiter.allow('a'), limiter.allow('a')]).toEqual([
      true,
      true,
      false,
    ]);
    expect(limiter.allow('b')).toBe(true);
  });

  it('slides: attempts older than the window stop counting', () => {
    const { limiter, advance } = setup();
    limiter.allow('a');
    advance(600);
    limiter.allow('a');
    expect(limiter.allow('a')).toBe(false);
    advance(401);
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(false);
  });

  it('stays bounded: past maxTracked, the oldest keys are forgotten', () => {
    const { limiter } = setup(2);
    limiter.allow('a');
    limiter.allow('a');
    limiter.allow('b');
    limiter.allow('c');
    expect(limiter.allow('a')).toBe(true);
  });
});
