import { CONTACT } from '../../constants';
import { hasFinePointer } from '../motion';
import type { Span } from './keyboard-fit';
import { keyboardFitDelta } from './keyboard-fit';

const { keyboardMinPx, marginPx, tolerancePx, settleMs } = CONTACT.keyboard;

const span = (element: Element): Span => {
  const { top, bottom } = element.getBoundingClientRect();
  return { top, bottom };
};

/**
 * Touch devices: once the on-screen keyboard is up, scroll so the whole terminal (title bar to
 * send row) sits above it, not just the focused field the browser scrolls to. Re-fits when the
 * keyboard settles, focus moves to another field, or the form grows (the output line, the brief);
 * never on the visitor's own scroll. A hardware keyboard leaves the viewport alone: nothing moves.
 */
export function initKeyboardFollow(form: HTMLElement): void {
  const viewport = window.visualViewport;
  if (!viewport || hasFinePointer()) return;
  // The visual viewport's height with no keyboard: tracked while focus is outside the form
  // (rotation, the browser's toolbars), so a keyboard is any drop below it once focus is in.
  let fullHeight = viewport.height;
  let frame = 0;
  let settleTimer = 0;

  const focusedField = (): HTMLElement | undefined => {
    const focused = document.activeElement;
    return focused instanceof HTMLElement && form.contains(focused) ? focused : undefined;
  };
  const fit = (): void => {
    frame = 0;
    const focused = focusedField();
    if (!focused) return;
    // Pinch-zoomed, the visitor is steering the view: leave it to them.
    if (viewport.scale > 1 || fullHeight - viewport.height < keyboardMinPx) return;
    const view = { top: viewport.offsetTop, bottom: viewport.offsetTop + viewport.height };
    const field = focused.closest('.term-line') ?? focused;
    const delta = keyboardFitDelta({
      form: span(form),
      focus: span(field),
      view,
      marginPx,
      tolerancePx,
    });
    // An absolute target (not scrollBy): a pass mid-way through a smooth scroll lands the same.
    if (delta !== 0) window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' });
  };
  const schedule = (): void => {
    if (frame === 0) frame = requestAnimationFrame(fit);
  };
  const scheduleSettled = (): void => {
    schedule();
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(schedule, settleMs);
  };

  // Hopping fields with the keyboard already up: fit now. Fresh focus: the keyboard's resize will.
  form.addEventListener('focusin', scheduleSettled);
  viewport.addEventListener('resize', () => {
    if (focusedField()) scheduleSettled();
    else fullHeight = viewport.height;
  });
  new ResizeObserver(schedule).observe(form);
}
