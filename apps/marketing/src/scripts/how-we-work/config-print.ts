// TEMPORARY (NWARE-82) How-we-work direction 3: the config file prints its lines (a CSS stagger)
// the first time a quarter of it is in view. Without JS every line simply shows.

export function initConfigPrint(): void {
  const file = document.querySelector<HTMLElement>('[data-hww-config]');
  if (!file) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      file.classList.add('is-printed');
      observer.disconnect();
    },
    { threshold: 0.25 },
  );
  observer.observe(file);
}
