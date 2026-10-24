/**
 * `--page-width` on <html>: the page's width without a scrollbar (the root's clientWidth), for
 * full-bleed layers that would otherwise use 100vw, which counts a classic scrollbar and so
 * overflows the page by its width. Nothing may clip that overflow on the way to How we work's
 * pinned stage (how-we-work.astro), so full-bleed layers fit instead. Updated when the width
 * changes; without JS the CSS falls back to 100vw.
 */
export function trackPageWidth(): void {
  const root = document.documentElement;
  let width = 0;
  const update = (): void => {
    if (root.clientWidth === width) return;
    width = root.clientWidth;
    root.style.setProperty('--page-width', `${width}px`);
  };
  update();
  window.addEventListener('resize', update, { passive: true });
}
