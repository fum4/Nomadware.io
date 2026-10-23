import { CURSOR_FIELD, GRID_WARP } from '../constants';
import { fieldStrength } from './cursor-field';
import type { Rgba } from './grid-glow';
import { glowGradient, parseColor } from './grid-glow';
import { hasFinePointer, isMobileViewport } from './motion';

/** global.css: the frame stops painting its CSS grid once the canvas has painted the same one. */
const LIVE_CLASS = 'is-grid-live';

/**
 * Pull at `distance` from the well as a share of that distance: a point moves toward the cursor
 * by distance × this. The peak (GRID_WARP.maxPullPx) sits at radius/√5, where d·(1−t²)² peaks at
 * 0.286·radius; never ≥ 1, so no point crosses the cursor.
 */
const PULL_SCALE = GRID_WARP.maxPullPx / (0.286 * CURSOR_FIELD.radiusPx);

/**
 * The page's grid paper on a fixed, viewport-sized canvas, bent toward the cursor like a
 * gravity well; the same lattice as the CSS grid in global.css (same --grid, --grid-line,
 * --grid-color, origin at the frame's top left), so at rest it is pixel-for-pixel the CSS one,
 * and band snapping (grid-band.ts) still holds. Mouse-first desktops only; elsewhere the CSS grid
 * stays. Draws only on pointer move, scroll and resize, and while the well settles.
 */
export function initGridWarp(): void {
  const frame = document.querySelector<HTMLElement>('[data-grid-paper]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-grid-canvas]');
  const context = canvas?.getContext('2d');
  if (!frame || !canvas || !context || !hasFinePointer() || isMobileViewport()) return;

  const pointer = { x: 0, y: 0 };
  const well = { x: 0, y: 0, depth: 0 };
  let grid = 0;
  let line = 0;
  let color = '';
  let glow: Rgba = [0, 0, 0, 0];
  let glowCore: Rgba = [0, 0, 0, 0];
  /** The bent stretches only: stroked a second time with the glow. */
  let bentPath = new Path2D();
  let ratio = 1;
  // The well holds while the cursor is on the page, still or not; it drains only once it leaves.
  let present = false;
  let frameId = 0;

  const readStyle = (): void => {
    const style = getComputedStyle(frame);
    grid = Number.parseFloat(style.getPropertyValue('--grid'));
    line = Number.parseFloat(style.getPropertyValue('--grid-line'));
    color = style.getPropertyValue('--grid-color').trim();
    glow = parseColor(context, style.getPropertyValue('--grid-glow'));
    glowCore = parseColor(context, style.getPropertyValue('--grid-glow-core'));
  };

  const resize = (): void => {
    ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    readStyle();
  };

  /** Where (x, y) lands, pulled toward the well. */
  const bend = (x: number, y: number): [number, number] => {
    const dx = well.x - x;
    const dy = well.y - y;
    const pull = PULL_SCALE * fieldStrength(Math.hypot(dx, dy)) * well.depth;
    return [x + dx * pull, y + dy * pull];
  };

  /**
   * One grid line at `fixed` (an x for a vertical line, a y for a horizontal one) of `length`:
   * straight outside the well's reach, drawn through bent samples inside it. Stroked on the
   * line's centre, so a straight stretch covers exactly the CSS line's pixels.
   */
  const strokeBent = (fixed: number, length: number, vertical: boolean): void => {
    const toXY = (across: number, along: number): [number, number] =>
      vertical ? [across, along] : [along, across];
    const centre = line / 2;
    const bentAt = (along: number): [number, number] => {
      const [x, y] = bend(...toXY(fixed, along));
      return vertical ? [x + centre, y] : [x, y + centre];
    };
    const reachFrom = Math.max(0, (vertical ? well.y : well.x) - CURSOR_FIELD.radiusPx);
    const reachTo = Math.min(length, (vertical ? well.y : well.x) + CURSOR_FIELD.radiusPx);
    context.moveTo(...toXY(fixed + centre, 0));
    bentPath.moveTo(...bentAt(reachFrom));
    for (let along = reachFrom; along < reachTo; along += GRID_WARP.sampleStepPx) {
      context.lineTo(...bentAt(along));
      bentPath.lineTo(...bentAt(along));
    }
    context.lineTo(...bentAt(reachTo));
    bentPath.lineTo(...bentAt(reachTo));
    context.lineTo(...toXY(fixed + centre, length));
  };

  const draw = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // The lattice is anchored to the frame, which scrolls; lines sit at origin + k·grid.
    const origin = frame.getBoundingClientRect();
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = line;
    const bent = well.depth > GRID_WARP.restDepth;
    const reach = CURSOR_FIELD.radiusPx;
    bentPath = new Path2D();
    context.beginPath();
    const firstX = origin.left + Math.ceil(-origin.left / grid) * grid;
    for (let x = firstX; x < width; x += grid) {
      if (bent && Math.abs(x - well.x) < reach) strokeBent(x, height, true);
      else context.fillRect(x, 0, line, height);
    }
    const firstY = origin.top + Math.ceil(-origin.top / grid) * grid;
    for (let y = firstY; y < height; y += grid) {
      if (bent && Math.abs(y - well.y) < reach) strokeBent(y, width, false);
      else context.fillRect(0, y, width, line);
    }
    context.stroke();
    if (bent) {
      context.strokeStyle = glowGradient(context, well, glowCore, glow);
      context.stroke(bentPath);
    }
  };

  let lastTick = 0;
  const tick = (now: number): void => {
    const elapsed = lastTick === 0 ? 16 : now - lastTick;
    lastTick = now;
    well.x += (pointer.x - well.x) * GRID_WARP.follow;
    well.y += (pointer.y - well.y) * GRID_WARP.follow;
    // Filling: a quick ease toward full. Draining: exponential, so it reaches restDepth exactly
    // fadeOutMs after the pointer left — fast at first, ever slower (an ease-out).
    if (present) well.depth += (1 - well.depth) * GRID_WARP.ease;
    else well.depth *= GRID_WARP.restDepth ** (elapsed / GRID_WARP.fadeOutMs);
    draw();
    // Settled either way the loop has nothing left to animate: full and on the cursor, or drained.
    const settled = present
      ? 1 - well.depth <= GRID_WARP.restDepth &&
        Math.hypot(pointer.x - well.x, pointer.y - well.y) < GRID_WARP.settlePx
      : well.depth <= GRID_WARP.restDepth;
    if (settled) lastTick = 0;
    frameId = settled ? 0 : requestAnimationFrame(tick);
  };

  const wake = (): void => {
    if (frameId === 0) frameId = requestAnimationFrame(tick);
  };

  const redraw = (): void => {
    if (frameId === 0) draw();
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      // Arriving from outside: the well starts under the cursor rather than sweeping in.
      if (well.depth <= GRID_WARP.restDepth) Object.assign(well, { x: pointer.x, y: pointer.y });
      present = true;
      wake();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    present = false;
    wake();
  });
  window.addEventListener('scroll', redraw, { passive: true });
  window.addEventListener('resize', () => {
    resize();
    redraw();
  });

  resize();
  draw();
  canvas.hidden = false;
  frame.classList.add(LIVE_CLASS);
}
