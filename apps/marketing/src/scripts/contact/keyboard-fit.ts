/** A vertical span in the layout viewport's coordinates (getBoundingClientRect's top/bottom). */
export interface Span {
  top: number;
  bottom: number;
}

export interface KeyboardFitInput {
  /** The whole form, title bar to send row. */
  form: Span;
  /** The focused field: it stays in view when the whole form can't. */
  focus: Span;
  /** What's visible above the keyboard: the visual viewport (offsetTop … offsetTop + height). */
  view: Span;
  /** Clearance kept from the visible area's top and bottom edges. */
  marginPx: number;
  /** A smaller correction than this is noise: no scroll. */
  tolerancePx: number;
}

/**
 * How far to scroll (px, + = down) so the form sits whole in the visible area above the
 * keyboard, moving it as little as possible; 0 when it already does. A form taller than that area
 * sits with its bottom (the send row) just above the keyboard, unless that hides the focused
 * field's top; a focused field taller than the area keeps its bottom (where the caret types) in view.
 */
export function keyboardFitDelta(input: KeyboardFitInput): number {
  const { form, focus, view, marginPx, tolerancePx } = input;
  const top = view.top + marginPx;
  const bottom = view.bottom - marginPx;
  let delta = 0;
  if (form.bottom - form.top <= bottom - top) {
    if (form.top < top) delta = form.top - top;
    else if (form.bottom > bottom) delta = form.bottom - bottom;
  } else {
    delta = form.bottom - bottom;
    const focusTopLimit = focus.top - top;
    if (delta > focusTopLimit) delta = Math.max(focusTopLimit, focus.bottom - bottom);
  }
  return Math.abs(delta) > tolerancePx ? delta : 0;
}
