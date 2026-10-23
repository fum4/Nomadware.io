import { CURSOR_FIELD, GRID_WARP } from '../constants';
import type { Well } from './grid-bend';
import { bendPoint, wellIsBending } from './grid-bend';
import type { SnappedBand } from './grid-band';
import { snappedBands } from './grid-band';

// The section bands' edges bend with the grid lines they sit on (grid-warp.ts calls this every
// time it draws). The band stays the CSS one (page-section.astro): above the column halo and the
// grid, where a canvas copy couldn't be. Near the well its ::before gets a polygon clip whose top
// and bottom edges run through bendPoint, the grid's own bend; elsewhere it keeps its default
// clip, so at rest it is the CSS band to the pixel and a band far from the cursor costs nothing.

/** The custom property page-section.astro's band ::before reads its clip from. */
const CLIP_PROPERTY = '--band-clip';

/** Bands currently carrying a bent clip: the only ones that need resetting. */
const bent = new Set<HTMLElement>();

/**
 * One edge at page y `edge` (viewport px), as polygon points in the ::before's own px space
 * (origin at the section's top left, before its translate + scaleY). Straight outside the well's
 * reach, sampled through bendPoint inside it; `reverse` walks right to left (the bottom edge).
 */
function edgePoints(
  edge: number,
  band: SnappedBand,
  origin: DOMRect,
  width: number,
  well: Well,
  reverse: boolean,
): string[] {
  const left = origin.left + band.left;
  const top = origin.top + band.top;
  const local = ([x, y]: [number, number]): string =>
    `${(x - left).toFixed(2)}px ${((y - top) / band.scale).toFixed(2)}px`;
  const from = Math.max(0, well.x - CURSOR_FIELD.radiusPx);
  const to = Math.min(width, well.x + CURSOR_FIELD.radiusPx);
  // Past the viewport on both sides: the band is full-bleed, the frame clips the overhang.
  const xs = [-GRID_WARP.maxPullPx, from];
  for (let x = from + GRID_WARP.sampleStepPx; x < to; x += GRID_WARP.sampleStepPx) xs.push(x);
  xs.push(to, width + GRID_WARP.maxPullPx);
  const points = xs.map((x) => local(bendPoint(x, edge, well)));
  return reverse ? points.toReversed() : points;
}

/** Bend every band edge within the well's reach; put every other band back to its CSS clip. */
export function warpBands(well: Well, origin: DOMRect, width: number): void {
  const bending = wellIsBending(well);
  for (const band of snappedBands()) {
    const top = origin.top + band.top;
    const bottom = origin.top + band.bottom;
    const near =
      bending &&
      (Math.abs(top - well.y) < CURSOR_FIELD.radiusPx ||
        Math.abs(bottom - well.y) < CURSOR_FIELD.radiusPx);
    if (!near) {
      if (bent.delete(band.section)) band.section.style.removeProperty(CLIP_PROPERTY);
      continue;
    }
    const points = [
      ...edgePoints(top, band, origin, width, well, false),
      ...edgePoints(bottom, band, origin, width, well, true),
    ];
    band.section.style.setProperty(CLIP_PROPERTY, `polygon(${points.join(', ')})`);
    bent.add(band.section);
  }
}
