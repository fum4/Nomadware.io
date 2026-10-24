import { PRINCIPLE_SWITCHER } from '../constants';
import { nextPage } from './principle-page';

// How we work (how-we-work.astro): on a desktop tall enough (PRINCIPLE_SWITCHER.pinQuery) the
// section is a scroll track with the switcher pinned in it. Scroll picks the principle: the
// track's scroll is split into one page per principle, the current tab's bar shows how far
// through its page the visitor is, and a tab click or ↑↓ / Home / End scrolls to that page, so
// scroll and selection never disagree. Elsewhere (phones, short viewports, no JS) the CSS stacks
// the principles and this stands down.

/** The stage's scroll position as pages: 0 where it pins, `pages` where it lets go. */
function pagePosition(track: HTMLElement, stage: HTMLElement, pages: number): number {
  const stickyTop = Number.parseFloat(getComputedStyle(stage).top);
  const scrollable = track.clientHeight - stage.offsetHeight;
  if (!(scrollable > 0)) return 0;
  const scrolled = stickyTop - track.getBoundingClientRect().top;
  return Math.min(pages, Math.max(0, (scrolled / scrollable) * pages));
}

export function initPrincipleSwitcher(): void {
  const track = document.querySelector<HTMLElement>('[data-principles]');
  const stage = track?.querySelector<HTMLElement>('[data-principles-stage]');
  if (!track || !stage) return;
  const tabs = [...track.querySelectorAll<HTMLButtonElement>('[data-principle-tab]')];
  const panels = [...track.querySelectorAll<HTMLElement>('[data-principle-panel]')];
  const pages = tabs.length;
  if (pages === 0 || pages !== panels.length) return;
  const pinned = window.matchMedia(PRINCIPLE_SWITCHER.pinQuery);

  let current = 0;
  const show = (page: number): void => {
    current = page;
    tabs.forEach((tab, index) => {
      const on = index === page;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel, index) => panel.classList.toggle('is-active', index === page));
  };

  let queued = false;
  const update = (): void => {
    queued = false;
    if (!pinned.matches) return;
    const position = pagePosition(track, stage, pages);
    const page = nextPage(position, current, pages, PRINCIPLE_SWITCHER.hysteresis);
    if (page !== current) show(page);
    const progress = Math.min(1, Math.max(0, position - current));
    track.style.setProperty('--page-progress', progress.toFixed(4));
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  // The stage's height centres it in the viewport while pinned.
  new ResizeObserver(() => {
    track.style.setProperty('--stage-h', `${stage.offsetHeight}px`);
    queue();
  }).observe(stage);

  const scrollToPage = (page: number): void => {
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top);
    const scrollable = track.clientHeight - stage.offsetHeight;
    const into = page === 0 ? 0 : page + PRINCIPLE_SWITCHER.landing;
    const pinAt = window.scrollY + track.getBoundingClientRect().top - stickyTop;
    window.scrollTo({ top: pinAt + (into / pages) * scrollable, behavior: 'smooth' });
  };

  tabs.forEach((tab, index) => tab.addEventListener('click', () => scrollToPage(index)));
  track.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    // From the focused tab, not the shown page: repeated keys outrun the smooth scroll.
    const from = tabs.indexOf(event.target);
    const moves: Record<string, number> = {
      ArrowDown: from + 1,
      ArrowUp: from - 1,
      Home: 0,
      End: pages - 1,
    };
    const move = moves[event.key];
    if (move === undefined || from < 0) return;
    event.preventDefault();
    const page = Math.min(pages - 1, Math.max(0, move));
    tabs[page]?.focus({ preventScroll: true });
    scrollToPage(page);
  });

  update();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  pinned.addEventListener('change', queue);
}
