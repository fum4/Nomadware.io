// Where a section band's painted edges go (scripts/grid-band.ts): on grid lines, with at least one
// full cell between each edge and the band's content. Each edge moves outward to the first line
// that clears the content by a cell, so the content-to-edge gap is always in [grid, 2 × grid) and
// grows by whole cells as the content wraps onto more lines; never by "whichever line is nearer".

/** Sub-pixel layout noise: a line this close inside the one-cell clearance still counts as clear. */
const SUBPIXEL_SLACK = 0.5;

export interface BandEdges {
  /** Just below a grid line, so that line shows at full strength above the band. */
  top: number;
  /** Just above a grid line, for the same reason. */
  bottom: number;
}

/** All positions in px from the grid paper's top; `line` is the grid line's thickness. */
export function bandEdges(
  contentTop: number,
  contentBottom: number,
  grid: number,
  line: number,
): BandEdges {
  const topLine = Math.floor((contentTop - grid + SUBPIXEL_SLACK) / grid) * grid;
  const bottomLine = Math.ceil((contentBottom + grid - SUBPIXEL_SLACK) / grid) * grid;
  return { top: topLine + line, bottom: bottomLine };
}
