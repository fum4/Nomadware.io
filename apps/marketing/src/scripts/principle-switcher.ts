import { FINE_POINTER_QUERY, MOBILE_QUERY, PRINCIPLE_SWITCHER } from '../constants';
import { nextPage } from './principle-page';

// How we work (how-we-work.astro): where the viewport is tall enough (PRINCIPLE_SWITCHER.pinQuery)
// the section is a scroll track whose stage is the band: it scrolls in, pins at the viewport's
// top while the scroll moves through one page per principle, then scrolls out. Scroll picks the
// principle, the current tab's bar shows how far through its page the visitor is, and a tab
// click or ↑↓ / Home / End scrolls to that page, so scroll and selection never disagree. This
// also lays the stage onto the page's grid paper: its top on a grid line (--snap, a margin under
// one cell) and its painted background across the paper's full width (--bleed-*), so the grid
// lines it paints are the page's. It also sizes the stage and the track in px (--stage-h,
// --visible-h, --track-room): on a touch browser the toolbars show and hide as the visitor scrolls
// (every iOS browser, and Arc resizes its whole web view), which changes the viewport's height,
// and with it every viewport unit, mid-scroll; there the sizes hold until the width changes (a
// rotation), the stage tall enough for the screen with its toolbars gone. Scrolling itself only
// switches classes and the current bar's transform, never a size. Elsewhere (short viewports, no JS) the CSS stacks the
// principles and this stands down.

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
  // `can-pin`: the server rendered the pinnable track (how-we-work.astro).
  if (!track || !stage || !track.classList.contains('can-pin')) return;
  const tabs = [...track.querySelectorAll<HTMLButtonElement>('[data-principle-tab]')];
  const panels = [...track.querySelectorAll<HTMLElement>('[data-principle-panel]')];
  const pages = tabs.length;
  if (pages === 0 || pages !== panels.length) return;
  const bars = tabs.map((tab) => tab.querySelector<HTMLElement>('[data-principle-bar]'));
  const pinned = window.matchMedia(PRINCIPLE_SWITCHER.pinQuery);
  const mobile = window.matchMedia(MOBILE_QUERY);
  const finePointer = window.matchMedia(FINE_POINTER_QUERY);
  const paper = document.querySelector<HTMLElement>('[data-grid-paper]');
  const readGrid = (): number =>
    paper ? Number.parseFloat(getComputedStyle(paper).getPropertyValue('--grid')) : 0;

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
    // On the bar itself, not an ancestor: a custom property on the track restyles the whole stage.
    bars[current]?.style.setProperty('--page-progress', progress.toFixed(4));
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  // Measured against the paper; the snap margin is read back out, so a second pass (the margin
  // grows the paper, which calls this again) sets the same values and the observer settles.
  const layOnPaper = (): void => {
    if (!paper) return;
    if (!pinned.matches) {
      track.style.removeProperty('--snap');
      return;
    }
    const grid = readGrid();
    if (!(grid > 0)) return;
    const paperBox = paper.getBoundingClientRect();
    const box = track.getBoundingClientRect();
    const snapped = Number.parseFloat(getComputedStyle(track).marginTop) || 0;
    const top = box.top - snapped - paperBox.top;
    track.style.setProperty('--snap', `${(((grid - (top % grid)) % grid) + grid) % grid}px`);
    track.style.setProperty('--bleed-left', `${paperBox.left - box.left}px`);
    track.style.setProperty('--bleed-width', `${paperBox.width}px`);
    queue();
  };
  if (paper) new ResizeObserver(layOnPaper).observe(paper);

  // The stage covers the viewport in whole cells (its bottom edge on a grid line too); its content
  // centres in the visible height; the track adds a page of scroll per principle, whole cells, so
  // the stage's grid lines are back on the page's when it lets go.
  let sizedWidth = 0;
  const sizeToViewport = (): void => {
    const grid = readGrid();
    const width = window.innerWidth;
    if (!(grid > 0) || (!finePointer.matches && width === sizedWidth)) return;
    sizedWidth = width;
    const visible = window.innerHeight;
    const sides = [window.screen.width, window.screen.height];
    const screenTall = visible >= width ? Math.max(...sides) : Math.min(...sides);
    const cover = finePointer.matches ? visible : Math.max(visible, screenTall);
    const { wide, phone } = PRINCIPLE_SWITCHER.pageSvh;
    const room = pages * (mobile.matches ? phone : wide) * visible;
    track.style.setProperty('--stage-h', `${Math.ceil(cover / grid) * grid}px`);
    track.style.setProperty('--visible-h', `${visible}px`);
    track.style.setProperty('--track-room', `${Math.round(room / grid) * grid}px`);
  };

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

  sizeToViewport();
  update();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => {
    sizeToViewport();
    queue();
  });
  const modeChange = (): void => {
    sizedWidth = 0;
    sizeToViewport();
    layOnPaper();
  };
  pinned.addEventListener('change', modeChange);
  mobile.addEventListener('change', modeChange);
}
