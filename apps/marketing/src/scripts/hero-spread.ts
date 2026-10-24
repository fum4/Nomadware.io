import { HERO_SPREAD } from '../constants';
import { isMobileViewport } from './motion';

/**
 * Phones only: spread the hero's three blocks apart at the top of the page and draw them back
 * together as the visitor scrolls (and apart again on the way back up). The spread is margin
 * (laid out once, at rest); scrolling closes it with transforms, so nothing below moves. Only a
 * width change (the phone breakpoint) re-reads it on resize: a touch browser's toolbars change
 * the height mid-scroll, and that changes nothing here.
 */
export function initHeroSpread(): void {
  const copy = document.querySelector<HTMLElement>('[data-hero-copy]');
  if (!copy) return;
  let frame = 0;
  const update = (): void => {
    frame = 0;
    const closed = isMobileViewport() ? Math.min(1, window.scrollY / HERO_SPREAD.scrollPx) : 0;
    copy.style.setProperty('--hero-closed', closed.toFixed(3));
  };
  const schedule = (): void => {
    if (frame === 0) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  let width = window.innerWidth;
  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      schedule();
    },
    { passive: true },
  );
  update();
}
