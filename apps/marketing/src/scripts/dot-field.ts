import { DOT_FIELD } from '../constants';
import { hasFinePointer, isMobileViewport, prefersReducedMotion } from './motion';

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
 * The loop runs only while the hero is on screen and the tab is visible; reduced motion draws
 * one still frame.
 */
export function initDotField(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-dot-field]');
  const context = canvas?.getContext('2d');
  const host = canvas?.parentElement;
  if (!canvas || !context || !host) return;

  const still = prefersReducedMotion();
  const chase = !still && hasFinePointer() && !isMobileViewport();
  const scale = DOT_FIELD.canvasScale;
  const pointer = { x: OFF_SCREEN, y: OFF_SCREEN };
  let dots: Dot[] = [];
  let onScreen = true;
  let frame = 0;

  const resize = (): void => {
    const width = Math.round(canvas.offsetWidth * scale);
    const height = Math.round(canvas.offsetHeight * scale);
    if (width === canvas.width && height === canvas.height) return;
    canvas.width = width;
    canvas.height = height;
    if (dots.length === 0) {
      const count = isMobileViewport() ? DOT_FIELD.countMobile : DOT_FIELD.countDesktop;
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
        vy: (Math.random() - 0.5) * DOT_FIELD.initialSpeed,
        highlight: Math.random() < DOT_FIELD.highlightShare,
      }));
    }
    if (still) draw();
  };

  const move = (dot: Dot): void => {
    const dx = dot.x - pointer.x;
    const dy = dot.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < DOT_FIELD.repelRadius) {
      dot.vx += (dx / distance) * DOT_FIELD.repelForce;
      dot.vy += (dy / distance) * DOT_FIELD.repelForce;
    }
    dot.vx = dot.vx * DOT_FIELD.friction + (Math.random() - 0.5) * DOT_FIELD.jitter;
    dot.vy = dot.vy * DOT_FIELD.friction + (Math.random() - 0.5) * DOT_FIELD.jitter;
    dot.x = (dot.x + dot.vx + canvas.width) % canvas.width;
    dot.y = (dot.y + dot.vy + canvas.height) % canvas.height;
  };

  function draw(): void {
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const dot of dots) {
      const size = dot.highlight ? DOT_FIELD.highlightSize : DOT_FIELD.size;
      context.fillStyle = dot.highlight ? DOT_FIELD.highlightColor : DOT_FIELD.color;
      context.fillRect(dot.x, dot.y, size, size);
    }
  }

  const tick = (): void => {
    dots.forEach(move);
    draw();
    frame = onScreen && !document.hidden ? requestAnimationFrame(tick) : 0;
  };

  const resume = (): void => {
    if (!still && frame === 0 && onScreen && !document.hidden) frame = requestAnimationFrame(tick);
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
