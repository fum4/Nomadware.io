import { HWW_LAYOUT } from '../../constants';

// TEMPORARY (NWARE-82) How-we-work direction 5: each statement lights in reading order as it
// rises through the viewport, from its top crossing HWW_LAYOUT.litStart of the viewport's height
// to HWW_LAYOUT.litEnd (`--lit` 0 → 1, scrubbed by scroll, both directions).

export function initStatements(): void {
  const items = [...document.querySelectorAll<HTMLElement>('[data-hww-statement]')];
  if (items.length === 0) return;

  let queued = false;
  const update = (): void => {
    queued = false;
    const height = window.innerHeight;
    const start = height * HWW_LAYOUT.litStart;
    const end = height * HWW_LAYOUT.litEnd;
    for (const item of items) {
      const top = item.getBoundingClientRect().top;
      const lit = Math.min(1, Math.max(0, (start - top) / (start - end)));
      item.style.setProperty('--lit', lit.toFixed(4));
    }
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
}
