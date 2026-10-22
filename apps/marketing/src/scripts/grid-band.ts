// Snaps the painted band of every `[data-grid-band]` section (page-section.astro, `band`) onto the
// grid paper drawn by `[data-grid-paper]` (base-layout.astro): each edge lands on the first grid
// line at least one cell clear of the band's content (the rule: grid-band-edges.ts), at any width
// and content height. CSS can't know where a box sits on the page, so this measures the section
// and moves its ::before with a transform: the section's own layout never changes, so nothing
// shifts (zero CLS) and re-running can't feed back into itself.

import { bandEdges } from './grid-band-edges';

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
      const padding = getComputedStyle(band);
      const top = box.top - origin;
      const edges = bandEdges(
        top + Number.parseFloat(padding.paddingTop),
        top + box.height - Number.parseFloat(padding.paddingBottom),
        grid,
        line,
      );
      const scale = box.height > 0 ? (edges.bottom - edges.top) / box.height : 1;
      return { shift: edges.top - top, scale };
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
