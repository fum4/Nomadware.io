import { describe, expect, it } from 'vitest';

import type { KeyboardFitInput } from './keyboard-fit';
import { keyboardFitDelta } from './keyboard-fit';

// A 390×844 phone with the keyboard up: 470 px visible, scrolled to the top of the layout viewport.
const VIEW = { top: 0, bottom: 470 };
const fit = (input: Partial<KeyboardFitInput>): number =>
  keyboardFitDelta({
    form: { top: 100, bottom: 400 },
    focus: { top: 150, bottom: 180 },
    view: VIEW,
    marginPx: 12,
    tolerancePx: 2,
    ...input,
  });

describe('a form that fits above the keyboard', () => {
  it('stays put when already inside the margins', () => {
    expect(fit({})).toBe(0);
    expect(fit({ form: { top: 12, bottom: 458 } })).toBe(0);
  });

  it('scrolls down just enough to lift a bottom hidden by the keyboard', () => {
    expect(fit({ form: { top: 300, bottom: 600 }, focus: { top: 350, bottom: 380 } })).toBe(142);
  });

  it('scrolls up just enough to bring a top above the view back', () => {
    expect(fit({ form: { top: -80, bottom: 220 } })).toBe(-92);
  });

  it('measures against the visual viewport, wherever it has panned to', () => {
    const view = { top: 200, bottom: 670 };
    expect(fit({ view, form: { top: 300, bottom: 600 } })).toBe(0);
    expect(fit({ view, form: { top: 450, bottom: 750 } })).toBe(92);
  });

  it('after iOS has panned the focused field into view, lifts only the rest of the form', () => {
    // The visual viewport panned 300 px down the layout viewport; the field is in view, the send
    // row is not: one correction, measured from the panned view.
    const view = { top: 300, bottom: 770 };
    expect(fit({ view, form: { top: 420, bottom: 800 }, focus: { top: 600, bottom: 630 } })).toBe(
      42,
    );
  });

  it('with the visual viewport panned (offsetTop > 0), leaves a form already whole in it alone', () => {
    // The terminal started low; iOS's scroll-to-focus panned the view 340 px and already
    // revealed it all: no correction on top of iOS's (the overshoot this guards against).
    const view = { top: 340, bottom: 810 };
    expect(fit({ view, form: { top: 360, bottom: 790 }, focus: { top: 600, bottom: 630 } })).toBe(
      0,
    );
  });

  it('is idempotent: once its delta is applied, the next answer is 0', () => {
    const view = { top: 340, bottom: 810 };
    const cases = [
      { form: { top: 500, bottom: 900 }, focus: { top: 700, bottom: 730 } },
      { form: { top: 100, bottom: 500 }, focus: { top: 150, bottom: 180 } },
      { form: { top: 200, bottom: 900 }, focus: { top: 400, bottom: 430 } },
    ];
    for (const { form, focus } of cases) {
      const delta = fit({ view, form, focus });
      const moved = (span: { top: number; bottom: number }) => ({
        top: span.top - delta,
        bottom: span.bottom - delta,
      });
      expect(fit({ view, form: moved(form), focus: moved(focus) })).toBe(0);
    }
  });

  it('ignores corrections within the tolerance (no back-and-forth)', () => {
    expect(fit({ form: { top: 100, bottom: 460 } })).toBe(0);
    expect(fit({ form: { top: 100, bottom: 461 } })).toBe(3);
  });
});

describe('a form taller than the visible area', () => {
  const form = { top: 200, bottom: 800 };

  it('puts the send row just above the keyboard', () => {
    expect(fit({ form, focus: { top: 400, bottom: 430 } })).toBe(342);
  });

  it('keeps the focused field in view when that would push it off the top', () => {
    expect(fit({ form, focus: { top: 250, bottom: 280 } })).toBe(238);
  });

  it('keeps the bottom of a focused field taller than the area, where the caret types', () => {
    expect(fit({ form, focus: { top: 250, bottom: 760 } })).toBe(302);
  });
});
