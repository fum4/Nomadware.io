import { MOBILE_QUERY } from '../../constants';

// TEMPORARY (NWARE-82) How-we-work direction 4: puts the diagonal blocks on the grid paper and
// draws the trace between them. The box is padded right and down (< one cell) so its top left
// lands on a grid intersection (the blocks sit whole cells from it, so their corners do too),
// then one orthogonal path runs along the grid lines: across each block's top edge to the next
// block's column, then down to its corner. A short bright dash travels it on a loop. Phones (CSS)
// keep a plain line down the left; this script then stands down.

/** One lap of the pulse along the whole trace. */
const PULSE_MS = 4_200;
/** The pulse's length as a share of the trace. */
const PULSE_SHARE = 0.12;

/** Distance from `value` up to the next multiple of `cell` (0 when already on one). */
const toNextLine = (value: number, cell: number): number =>
  (((cell - (value % cell)) % cell) + cell) % cell;

export function initCircuit(): void {
  const root = document.querySelector<HTMLElement>('[data-hww-circuit]');
  const paper = document.querySelector<HTMLElement>('[data-grid-paper]');
  const wire = root?.querySelector<SVGPathElement>('[data-hww-wire]');
  const pulse = root?.querySelector<SVGPathElement>('[data-hww-pulse]');
  if (!root || !paper || !wire || !pulse) return;
  const blocks = [...root.querySelectorAll<HTMLElement>('[data-hww-block]')];
  const mobile = window.matchMedia(MOBILE_QUERY);
  let animation: Animation | undefined;

  const layout = (): void => {
    animation?.cancel();
    if (mobile.matches) {
      root.style.removeProperty('--snap-x');
      root.style.removeProperty('--snap-y');
      return;
    }
    const grid = Number.parseFloat(getComputedStyle(paper).getPropertyValue('--grid'));
    if (!(grid > 0)) return;

    // The box's own padding never moves its border box: this is always the unsnapped position.
    const paperBox = paper.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const left = box.left - paperBox.left;
    const top = box.top - paperBox.top;
    root.style.setProperty('--snap-x', `${toNextLine(left, grid)}px`);
    root.style.setProperty('--snap-y', `${toNextLine(top, grid)}px`);

    // Corners in the root's own px (the SVG fills it), each centred on its 1px line.
    const origin = root.getBoundingClientRect();
    const corners = blocks.map((block) => {
      const corner = block.getBoundingClientRect();
      return { x: corner.left - origin.left + 0.5, y: corner.top - origin.top + 0.5 };
    });
    const [first, ...rest] = corners;
    if (!first) return;
    let d = `M ${first.x} ${first.y}`;
    for (const corner of rest) d += ` H ${corner.x} V ${corner.y}`;
    wire.setAttribute('d', d);
    pulse.setAttribute('d', d);

    const length = wire.getTotalLength();
    const dash = length * PULSE_SHARE;
    pulse.style.strokeDasharray = `${dash} ${length}`;
    animation = pulse.animate(
      [{ strokeDashoffset: `${dash}` }, { strokeDashoffset: `${-length}` }],
      { duration: PULSE_MS, iterations: Infinity, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
    );
  };

  // The padding grows the paper, which calls this again: the box's position hasn't moved, so the
  // second pass sets the same values and the observer settles.
  let queued = false;
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      layout();
    });
  };
  new ResizeObserver(queue).observe(paper);
  mobile.addEventListener('change', queue);
}
