import { CONTACT } from '../../constants';
import { hasFinePointer } from '../motion';
import type { Span } from './keyboard-fit';
import { keyboardFitDelta } from './keyboard-fit';
import type { SettleWatch } from './settle-watch';
import { createSettleWatch } from './settle-watch';

const { keyboardMinPx, marginPx, tolerancePx, settle } = CONTACT.keyboard;

const span = (element: Element): Span => {
  const { top, bottom } = element.getBoundingClientRect();
  return { top, bottom };
};

/** Half a CSS px: finer than iOS's own scroll steps, coarse enough to ignore float noise. */
const quantize = (value: number): number => Math.round(value * 2) / 2;

/**
 * Touch devices: once the on-screen keyboard is up, scroll so the whole terminal (title bar to
 * send row) sits above it, not just the focused field the browser scrolls to. At most once per
 * visit to the form (again only after focus has left it, or the form has changed size), and only
 * once the browser has finished moving the page: focus entering the form, the keyboard's resize
 * of the visual viewport or the form's resize start a frame-by-frame watch (settle-watch.ts), and
 * when the visual viewport and the scroll position have both held still the form is fitted,
 * instantly, if it isn't already whole in view. iOS's animated scroll-to-focus takes longer the
 * lower the field starts; a correction on a fixed delay landed mid-way and added to it (the
 * terminal arrived above the keyboard, then went on up). A browser that never settles within
 * maxWaitMs gets the correction then. A hardware keyboard leaves the viewport alone: nothing moves.
 */
export function initKeyboardFollow(form: HTMLElement): void {
  const viewport = window.visualViewport;
  if (!viewport || hasFinePointer()) return;
  // The visual viewport's height with no keyboard: tracked while focus is outside the form
  // (rotation, the browser's toolbars), so a keyboard is any drop below it once focus is in.
  let fullHeight = viewport.height;
  // One correction per visit: set when it has run, cleared when focus leaves the form or the
  // form changes size.
  let corrected = false;
  let watch: SettleWatch | undefined;
  let frame = 0;

  const focusedField = (): HTMLElement | undefined => {
    const focused = document.activeElement;
    return focused instanceof HTMLElement && form.contains(focused) ? focused : undefined;
  };

  const fit = (): void => {
    const focused = focusedField();
    if (!focused) return;
    // Pinch-zoomed, the visitor is steering the view: leave it to them.
    if (viewport.scale > 1) return;
    // No keyboard yet (it may still be coming: its resize re-arms the watch).
    if (fullHeight - viewport.height < keyboardMinPx) return;
    corrected = true;
    const field = focused.closest('.term-line') ?? focused;
    // Client rects and the visual viewport's offsetTop are both in layout-viewport coordinates,
    // so the delta is a distance, whichever viewport the scroll moves. Applied relative
    // (scrollBy), never as scrollY + delta: with the keyboard up, iOS can report scrollY for one
    // viewport and scroll the other, which would add the visual viewport's pan on top.
    const delta = keyboardFitDelta({
      form: span(form),
      focus: span(field),
      view: { top: viewport.offsetTop, bottom: viewport.offsetTop + viewport.height },
      marginPx,
      tolerancePx,
    });
    // Instant, explicitly: html's scroll-behavior is smooth, and an animation would race iOS's.
    if (delta !== 0) window.scrollBy({ top: delta, behavior: 'instant' });
  };

  const stop = (): void => {
    cancelAnimationFrame(frame);
    frame = 0;
    watch = undefined;
  };
  const sample = (now: number): void => {
    frame = 0;
    if (!watch) return;
    const verdict = watch.observe(
      {
        viewport: [viewport.height, viewport.offsetTop].map(quantize),
        scrollY: quantize(window.scrollY),
      },
      now,
    );
    if (verdict === 'wait') {
      frame = requestAnimationFrame(sample);
      return;
    }
    stop();
    fit();
  };
  const arm = (): void => {
    if (corrected || !focusedField()) return;
    watch = createSettleWatch(settle, performance.now());
    if (frame === 0) frame = requestAnimationFrame(sample);
  };

  form.addEventListener('focusin', arm);
  form.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && form.contains(event.relatedTarget)) return;
    corrected = false;
    stop();
  });
  viewport.addEventListener('resize', () => {
    if (focusedField()) arm();
    else fullHeight = viewport.height;
  });
  new ResizeObserver(() => {
    if (!focusedField()) return;
    corrected = false;
    arm();
  }).observe(form);
}
