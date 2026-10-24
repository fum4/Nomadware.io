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
 * send row) sits above it, not just the focused field the browser scrolls to. One correction, once
 * everything has settled: focus entering or moving within the form, the keyboard's resize of the
 * visual viewport, or the form changing size while focused arm a timer; any of those, or the
 * browser's own pan of the visual viewport (iOS scrolls the focused field into view, animated),
 * restart it; settleMs of quiet and it fits once, instantly. Several smooth scrolls racing iOS's
 * own animated scroll-to-focus (and html's smooth scroll-behavior) is what jittered. Never armed
 * by the visitor's own scroll. A hardware keyboard leaves the viewport alone: nothing moves.
 */
export function initKeyboardFollow(form: HTMLElement): void {
  const viewport = window.visualViewport;
  if (!viewport || hasFinePointer()) return;
  // The visual viewport's height with no keyboard: tracked while focus is outside the form
  // (rotation, the browser's toolbars), so a keyboard is any drop below it once focus is in.
  let fullHeight = viewport.height;
  let timer = 0;

  const focusedField = (): HTMLElement | undefined => {
    const focused = document.activeElement;
    return focused instanceof HTMLElement && form.contains(focused) ? focused : undefined;
  };
  const fit = (): void => {
    timer = 0;
    const focused = focusedField();
    if (!focused) return;
    // Pinch-zoomed, the visitor is steering the view: leave it to them.
    if (viewport.scale > 1 || fullHeight - viewport.height < keyboardMinPx) return;
    const field = focused.closest('.term-line') ?? focused;
    const delta = keyboardFitDelta({
      form: span(form),
      focus: span(field),
      view: { top: viewport.offsetTop, bottom: viewport.offsetTop + viewport.height },
      marginPx,
      tolerancePx,
    });
    // Instant, explicitly: html's scroll-behavior is smooth, and an animation would race iOS's.
    if (delta !== 0) window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
  };
  const arm = (): void => {
    clearTimeout(timer);
    timer = window.setTimeout(fit, settleMs);
  };
  const extend = (): void => {
    if (timer !== 0) arm();
  };

  form.addEventListener('focusin', arm);
  viewport.addEventListener('resize', () => {
    if (focusedField()) arm();
    else fullHeight = viewport.height;
  });
  viewport.addEventListener('scroll', extend);
  new ResizeObserver(() => {
    if (focusedField()) arm();
  }).observe(form);
}
