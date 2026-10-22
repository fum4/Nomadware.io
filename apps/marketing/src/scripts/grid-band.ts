// Snaps the painted band of every `[data-grid-band]` section (page-section.astro, `band`) onto the
// grid paper drawn by `[data-grid-paper]` (base-layout.astro): its top and bottom edges land
// exactly on grid lines at any width and content height: it starts just below one line and ends
// just above another, so both lines it sits between show at full strength. CSS can't know where a box sits on the
// page, so this measures the section and moves its ::before with a transform: the section's own
// layout never changes, so nothing shifts (zero CLS) and re-running can't feed back into itself.

/** The nearest grid line, so an edge never moves more than half a cell either way. */
const nearestLine = (position: number, grid: number): number => Math.round(position / grid) * grid;

export function snapGridBands(): void {
  const bands = [...document.querySelectorAll<HTMLElement>('[data-grid-band]')];
  const paper = document.querySelector<HTMLElement>('[data-grid-paper]');
  if (!paper || bands.length === 0) return;

  // Read everything first, then write: one layout per pass.
  const snapAll = (): void => {
    const style = getComputedStyle(paper);
    const grid = Number.parseFloat(style.getPropertyValue('--grid'));
    const line = Number.parseFloat(style.getPropertyValue('--grid-line'));
    if (!(grid > 0) || !(line >= 0)) return;
    const origin = paper.getBoundingClientRect().top;
    const snaps = bands.map((band) => {
      const box = band.getBoundingClientRect();
      const top = box.top - origin;
      const bandTop = nearestLine(top, grid) + line;
      const bandBottom = nearestLine(top + box.height, grid);
      const scale = box.height > 0 ? (bandBottom - bandTop) / box.height : 1;
      return { shift: bandTop - top, scale };
    });
    bands.forEach((band, index) => {
      const snap = snaps[index];
      if (!snap) return;
      band.style.setProperty('--band-shift', `${snap.shift}px`);
      band.style.setProperty('--band-scale', String(snap.scale));
    });
  };

  // The paper resizes whenever anything above or inside a band reflows (viewport width, a font
  // swap, the stats numbers). Callbacks run after layout and before paint.
  new ResizeObserver(snapAll).observe(paper);
}
