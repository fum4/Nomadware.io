import { MOBILE_QUERY } from '../../constants';

// TEMPORARY (NWARE-82) How-we-work direction 2: an ARIA tab list (vertical) over the three
// principles. The current tab's bar animation is the clock: when it ends, the next tab takes
// over (the bar's animation applies only to the selected tab, so a new tab's fill starts empty).
// The CSS pauses it while the switcher is hovered or holds focus and until it has been in
// view; on phones (and without JS) the panels simply stack.

export function initTabs(): void {
  const root = document.querySelector<HTMLElement>('[data-hww-tabs]');
  if (!root) return;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-hww-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-hww-panel]')];
  if (tabs.length === 0 || tabs.length !== panels.length) return;

  let current = 0;
  const select = (next: number, focus: boolean): void => {
    current = (next + tabs.length) % tabs.length;
    tabs.forEach((tab, index) => {
      const on = index === current;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel, index) => panel.classList.toggle('is-active', index === current));
    if (focus) tabs[current]?.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index, false));
    tab.querySelector('[data-hww-bar]')?.addEventListener('animationend', () => {
      if (index === current) select(current + 1, false);
    });
  });

  root.addEventListener('keydown', (event) => {
    const moves: Record<string, number> = {
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined || !(event.target instanceof HTMLButtonElement)) return;
    event.preventDefault();
    select(next, true);
  });

  const mobile = window.matchMedia(MOBILE_QUERY);
  const applyMode = (): void => {
    root.classList.toggle('is-tabbed', !mobile.matches);
  };
  applyMode();
  mobile.addEventListener('change', applyMode);

  new IntersectionObserver(
    (entries) => {
      for (const entry of entries) root.classList.toggle('is-running', entry.isIntersecting);
    },
    { threshold: 0.5 },
  ).observe(root);
}
