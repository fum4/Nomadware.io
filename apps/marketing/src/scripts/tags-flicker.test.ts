import { describe, expect, it } from 'vitest';

import { flickerKeyframes } from './tags-flicker';

const LIT = 'rgb(138, 136, 156)';
const RUNS = 200;
const runs = (): Keyframe[][] => Array.from({ length: RUNS }, () => flickerKeyframes(LIT));

describe('flickerKeyframes', () => {
  // A compositor property would give the word a compositing layer for each swap, which jolted the
  // tags line and darkened the page on a phone (tags-flicker.ts).
  it('animates paint-only properties, never opacity, transform or filter', () => {
    for (const keyframes of runs()) {
      for (const keyframe of keyframes) {
        expect(Object.keys(keyframe).toSorted()).toEqual(
          keyframe.offset === 1
            ? ['color', 'offset', 'textShadow']
            : ['color', 'easing', 'offset', 'textShadow'],
        );
      }
    }
  });

  it('starts dark and lands on the lit colour, without a glow', () => {
    for (const keyframes of runs()) {
      expect(keyframes[0]).toMatchObject({
        offset: 0,
        color: `color-mix(in srgb, ${LIT} 0.0%, transparent)`,
      });
      expect(keyframes.at(-1)).toEqual({ offset: 1, color: LIT, textShadow: 'none' });
    }
  });

  it('steps through rising offsets inside the run', () => {
    for (const keyframes of runs()) {
      const offsets = keyframes.map((keyframe) => Number(keyframe.offset));
      expect(offsets).toEqual(offsets.toSorted((a, b) => a - b));
      expect(Math.min(...offsets)).toBe(0);
      expect(Math.max(...offsets)).toBe(1);
    }
  });
});
