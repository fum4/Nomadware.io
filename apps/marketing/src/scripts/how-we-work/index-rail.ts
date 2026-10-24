// TEMPORARY (NWARE-82) How-we-work direction 1: the rail fills as the list scrolls past the
// viewport's middle, and each row whose top the fill has passed lights its numeral. Without JS the
// rail shows full and every numeral outlined.

/** The viewport height share the fill's tip follows. */
const TIP_SHARE = 0.6;

export function initIndexRail(): void {
  const list = document.querySelector<HTMLElement>('[data-hww-index]');
  if (!list) return;
  const rows = [...list.querySelectorAll<HTMLElement>('[data-hww-index-row]')];

  let queued = false;
  const update = (): void => {
    queued = false;
    const box = list.getBoundingClientRect();
    const tip = window.innerHeight * TIP_SHARE;
    const fill = Math.min(1, Math.max(0, (tip - box.top) / box.height));
    list.style.setProperty('--rail', fill.toFixed(4));
    for (const row of rows) {
      row.classList.toggle('is-reached', row.getBoundingClientRect().top + 40 <= tip);
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
