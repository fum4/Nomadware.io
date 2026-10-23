import { DOT_FIELD } from '../constants';
import { fieldStrength } from './cursor-field';
import { hasFinePointer, isMobileViewport } from './motion';

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  highlight: boolean;
}

const OFF_SCREEN = -9_999;

/**
 * Drifting dots behind the hero; on a mouse-first desktop they scatter from the cursor.
 * The loop runs only while the hero is on screen and the tab is visible.
 */
export function initDotField(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-dot-field]');
  const context = canvas?.getContext('2d');
  const host = canvas?.parentElement;
  if (!canvas || !context || !host) return;

  const chase = hasFinePointer() && !isMobileViewport();
  // TEMPORARY (NWARE-82): dev-only test of dots gathering to the cursor instead of scattering.
  const gather =
    import.meta.env.DEV && new URLSearchParams(location.search).get('dots') === 'gravity';
  const scale = DOT_FIELD.canvasScale;
  const pointer = { x: OFF_SCREEN, y: OFF_SCREEN };
  let dots: Dot[] = [];
  // Where dots live and drift back to (canvas px): the content column, barely spilling past it,
  // over the hero's own height. The canvas reaches past it so a pushed dot can fly to the edge.
  const home = { left: 0, right: 0, top: 0, bottom: 0 };
  let onScreen = true;
  let frame = 0;

  const resize = (): void => {
    const width = Math.round(canvas.offsetWidth * scale);
    const height = Math.round(canvas.offsetHeight * scale);
    if (width === canvas.width && height === canvas.height) return;
    canvas.width = width;
    canvas.height = height;
    const box = canvas.getBoundingClientRect();
    const column = host.getBoundingClientRect();
    const spill = DOT_FIELD.homeSpillPx;
    home.left = Math.max(0, (column.left - box.left - spill) * scale);
    home.right = Math.min(width, (column.right - box.left + spill) * scale);
    home.top = (column.top - box.top) * scale;
    home.bottom = (column.bottom - box.top) * scale;
    if (dots.length === 0) {
      const density = isMobileViewport() ? DOT_FIELD.densityMobile : DOT_FIELD.densityDesktop;
      const area = ((home.right - home.left) / scale) * ((home.bottom - home.top) / scale);
      const count = Math.round((area * density) / 10_000);
      dots = Array.from({ length: count }, () => ({
        x: home.left + Math.random() * (home.right - home.left),
        y: home.top + Math.random() * (home.bottom - home.top),
        vx: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
        vy: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
        highlight: Math.random() < DOT_FIELD.highlightShare,
      }));
    }
  };

  const move = (dot: Dot): void => {
    const dx = dot.x - pointer.x;
    const dy = dot.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const push = distance > 0 ? cursorPush(distance / scale) : 0;
    if (push !== 0) {
      dot.vx += (dx / distance) * push;
      dot.vy += (dy / distance) * push;
    }
    // Outside home, a soft spring toward its nearest edge: a pushed dot drifts back, never snaps.
    const clampX = Math.min(home.right, Math.max(home.left, dot.x));
    const clampY = Math.min(home.bottom, Math.max(home.top, dot.y));
    dot.vx += (clampX - dot.x) * DOT_FIELD.homePull;
    dot.vy += (clampY - dot.y) * DOT_FIELD.homePull;
    dot.vx = dot.vx * DOT_FIELD.friction + (Math.random() - 0.5) * DOT_FIELD.jitter;
    dot.vy = dot.vy * DOT_FIELD.friction + (Math.random() - 0.5) * DOT_FIELD.jitter;
    // The canvas edge stops a dot; home pulls it back from there.
    dot.x = Math.min(canvas.width, Math.max(0, dot.x + dot.vx));
    dot.y = Math.min(canvas.height, Math.max(0, dot.y + dot.vy));
  };

  // Positive pushes away from the cursor, negative pulls toward it.
  const cursorPush = (distance: number): number => {
    if (!gather) return DOT_FIELD.repelForce * fieldStrength(distance);
    if (distance < DOT_FIELD.gatherCorePx) {
      return DOT_FIELD.gatherCorePush * (1 - distance / DOT_FIELD.gatherCorePx);
    }
    return -DOT_FIELD.gatherForce * fieldStrength(distance);
  };

  const draw = (): void => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const dot of dots) {
      const size = dot.highlight ? DOT_FIELD.highlightSize : DOT_FIELD.size;
      context.fillStyle = dot.highlight ? DOT_FIELD.highlightColor : DOT_FIELD.color;
      context.fillRect(dot.x, dot.y, size, size);
    }
  };

  const tick = (): void => {
    dots.forEach(move);
    draw();
    frame = onScreen && !document.hidden ? requestAnimationFrame(tick) : 0;
  };

  const resume = (): void => {
    if (frame === 0 && onScreen && !document.hidden) frame = requestAnimationFrame(tick);
  };

  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    resume();
  }).observe(host);
  document.addEventListener('visibilitychange', resume);

  if (chase) {
    host.addEventListener('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - bounds.left) * scale;
      pointer.y = (event.clientY - bounds.top) * scale;
    });
    host.addEventListener('pointerleave', () => {
      pointer.x = OFF_SCREEN;
      pointer.y = OFF_SCREEN;
    });
  }
  resume();
}
