import { describe, expect, it } from 'vitest';

import { canPinAt } from './principle-pin';

describe('canPinAt', () => {
  it('pins a phone in portrait, at any height from 500 px', () => {
    expect(canPinAt(390, 664)).toBe(true);
    expect(canPinAt(390, 500)).toBe(true);
    expect(canPinAt(390, 499)).toBe(false);
  });

  it('asks more of anything wider than a phone: 600 px', () => {
    expect(canPinAt(1280, 800)).toBe(true);
    expect(canPinAt(1280, 600)).toBe(true);
    expect(canPinAt(844, 390)).toBe(false);
    expect(canPinAt(641, 599)).toBe(false);
  });

  it('puts the breakpoint at 640 px, as MOBILE_QUERY does', () => {
    expect(canPinAt(640, 550)).toBe(true);
    expect(canPinAt(641, 550)).toBe(false);
  });
});
