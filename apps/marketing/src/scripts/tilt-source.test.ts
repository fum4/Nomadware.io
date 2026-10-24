import { describe, expect, it } from 'vitest';

import { createSourcePicker, TILT_SOURCES } from './tilt-source';

describe('createSourcePicker', () => {
  it('ranks the fused orientation first, its absolute twin next, raw motion last', () => {
    expect(TILT_SOURCES).toEqual(['orientation', 'absolute', 'motion']);
  });

  it('takes whichever source delivers first, alone', () => {
    const picker = createSourcePicker();
    expect(picker.accept('motion')).toBe(true);
    expect(picker.accept('motion')).toBe(true);
  });

  it('a better source arriving later takes over, and the worse one is dropped for good', () => {
    const picker = createSourcePicker();
    expect(picker.accept('motion')).toBe(true);
    expect(picker.accept('absolute')).toBe(true);
    expect(picker.accept('motion')).toBe(false);
    expect(picker.accept('orientation')).toBe(true);
    expect(picker.accept('absolute')).toBe(false);
    expect(picker.accept('motion')).toBe(false);
    expect(picker.accept('orientation')).toBe(true);
  });

  it('with deviceorientation delivering, the others never interleave', () => {
    const picker = createSourcePicker();
    expect(picker.accept('orientation')).toBe(true);
    expect(picker.accept('absolute')).toBe(false);
    expect(picker.accept('motion')).toBe(false);
  });
});
