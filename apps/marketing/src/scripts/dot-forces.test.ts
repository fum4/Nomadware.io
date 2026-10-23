import { describe, expect, it } from 'vitest';

import { DOT_FIELD } from '../constants';
import { cursorPull, releaseEnvelope } from './dot-forces';

describe('releaseEnvelope', () => {
  it('rises over the ramp, falls back to 0 by releaseMs', () => {
    expect(releaseEnvelope(0)).toBe(0);
    expect(releaseEnvelope(DOT_FIELD.releaseRampMs / 2)).toBeCloseTo(0.5);
    expect(releaseEnvelope(DOT_FIELD.releaseRampMs)).toBe(1);
    expect(releaseEnvelope(DOT_FIELD.releaseMs)).toBe(0);
    expect(releaseEnvelope(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('cursorPull', () => {
  it('pushes out inside the core and pulls in beyond it, harder when closer', () => {
    const core = DOT_FIELD.gatherCorePx;
    expect(cursorPull(core / 2)).toBeGreaterThan(0);
    const near = cursorPull(core + 10);
    const far = cursorPull(core + 100);
    expect(near).toBeLessThan(far);
    expect(far).toBeLessThan(0);
  });
});
