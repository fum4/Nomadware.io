import { CURSOR_FIELD, DOT_FIELD } from '../constants';
import type { BlackHole } from './black-hole';
import { createBlackHole } from './black-hole';
import { cursorPull, releaseEnvelope } from './dot-forces';
import type { Body } from './dot-separation';
import { SeparationGrid } from './dot-separation';
import { hasFinePointer, isMobileViewport } from './motion';

interface Dot extends Body {
  highlight: boolean;
  /** Inside the cursor's field this frame. */
  captured: boolean;
  /** When it last left the field (performance.now()), -Infinity if never. */
  releasedAt: number;
  /** How long its fade-in on load takes, from the field's first frame. */
  appearMs: number;
}

const OFF_SCREEN = -9_999;

/**
 * Drifting dots behind the hero. On a mouse-first desktop the cursor gathers the dots near it;
 * when it stops they settle into an even ring around it, and when it rests a small black hole
 * seeps in at its centre, inside the ring (scripts/black-hole.ts); when it leaves the clump diffuses
 * slowly back into the drift. The loop runs only while the hero is on screen and the tab is
 * visible.
 */
export function initDotField(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-dot-field]');
  const context = canvas?.getContext('2d');
  const host = canvas?.parentElement;
  if (!canvas || !context || !host) return;

  const chase = hasFinePointer() && !isMobileViewport();
  const scale = DOT_FIELD.canvasScale;
  const pointer = { x: OFF_SCREEN, y: OFF_SCREEN };
  // Where the pointer last moved more than stillPx from, and when: it is still once stillMs pass.
  const anchor = { x: OFF_SCREEN, y: OFF_SCREEN, at: 0 };
  const grid = new SeparationGrid();
  const hole: BlackHole | null = chase ? createBlackHole(scale) : null;
  let dots: Dot[] = [];
  // Where dots live and drift back to (canvas px): the content column, barely spilling past it,
  // over the hero's own height. The canvas reaches past it so a pushed dot can fly to the edge.
  const home = { left: 0, right: 0, top: 0, bottom: 0 };
  let onScreen = true;
  let frame = 0;
  let lastStep = 0;
  // The first frame: on load the dots fade in from it, each after its own delay, so the field
  // condenses instead of popping in at once.
  let firstFrame = 0;

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
        captured: false,
        releasedAt: Number.NEGATIVE_INFINITY,
        appearMs:
          DOT_FIELD.appearMinMs + Math.random() * (DOT_FIELD.appearMaxMs - DOT_FIELD.appearMinMs),
      }));
    }
  };

  // `dt` = frames of DOT_FIELD.frameMs this step covers: the same motion at 30, 60 or 120 Hz.
  const move = (dot: Dot, now: number, still: boolean, dt: number): void => {
    const dx = dot.x - pointer.x;
    const dy = dot.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const pull = dot.captured && distance > 0 ? cursorPull(distance / scale) : 0;
    if (pull !== 0) {
      dot.vx += (dx / distance) * pull * dt;
      dot.vy += (dy / distance) * pull * dt;
    }
    // Outside home, a soft spring toward its nearest edge: a pushed dot drifts back, never snaps.
    const clampX = Math.min(home.right, Math.max(home.left, dot.x));
    const clampY = Math.min(home.bottom, Math.max(home.top, dot.y));
    dot.vx += (clampX - dot.x) * DOT_FIELD.homePull * dt;
    dot.vy += (clampY - dot.y) * DOT_FIELD.homePull * dt;
    // Settling round a still pointer: heavy damping, no jitter, so the disc comes to rest.
    // Just released: extra jitter that fades, a random walk that mixes the clump back in.
    // And the settle's damping eases off over the release ramp: the packed disc loosens slowly
    // instead of springing apart the moment the pull stops.
    const settling = dot.captured && still;
    const age = now - dot.releasedAt;
    const loosened = settling ? 0 : Math.min(1, age / DOT_FIELD.releaseRampMs);
    const { settleFriction } = DOT_FIELD;
    const friction = (settleFriction + (DOT_FIELD.friction - settleFriction) * loosened) ** dt;
    // A random walk's spread grows with the square root of time.
    const jitter = settling
      ? 0
      : DOT_FIELD.jitter * Math.sqrt(dt) * (1 + DOT_FIELD.releaseJitter * releaseEnvelope(age));
    dot.vx = dot.vx * friction + (Math.random() - 0.5) * jitter;
    dot.vy = dot.vy * friction + (Math.random() - 0.5) * jitter;
    // A speed limit, so a dot falling in fast can't tunnel through the core in one frame.
    const speed = Math.hypot(dot.vx, dot.vy);
    if (speed > DOT_FIELD.maxSpeed) {
      dot.vx *= DOT_FIELD.maxSpeed / speed;
      dot.vy *= DOT_FIELD.maxSpeed / speed;
    }
    // The canvas edge stops a dot; home pulls it back from there.
    dot.x = Math.min(canvas.width, Math.max(0, dot.x + dot.vx * dt));
    dot.y = Math.min(canvas.height, Math.max(0, dot.y + dot.vy * dt));
  };

  // A dot's separation radius (canvas px): the packing distance, widened while it diffuses.
  const radiusOf = (index: number, now: number): number => {
    const dot = dots[index];
    const spread = dot ? releaseEnvelope(now - dot.releasedAt) : 0;
    const { separationPx, releaseSpacingPx } = DOT_FIELD;
    return (separationPx + (releaseSpacingPx - separationPx) * spread) * scale;
  };

  const step = (now: number, dt: number): void => {
    const active = pointer.x !== OFF_SCREEN;
    const still = active && now - anchor.at > DOT_FIELD.stillMs;
    const reach = CURSOR_FIELD.radiusPx * scale;
    hole?.update(now, active ? pointer : null, active ? now - anchor.at : 0);
    for (const dot of dots) {
      const captured = active && Math.hypot(dot.x - pointer.x, dot.y - pointer.y) < reach;
      if (dot.captured && !captured) dot.releasedAt = now;
      dot.captured = captured;
    }
    grid.separate(
      dots,
      (index) => radiusOf(index, now),
      DOT_FIELD.releaseSpacingPx * scale,
      DOT_FIELD.separationForce * dt,
    );
    for (const dot of dots) move(dot, now, still, dt);
  };

  const draw = (now: number): void => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    hole?.draw(context);
    const sinceFirst = now - firstFrame;
    const appearing = sinceFirst < DOT_FIELD.appearMaxMs;
    for (const dot of dots) {
      const size = dot.highlight ? DOT_FIELD.highlightSize : DOT_FIELD.size;
      if (appearing) {
        context.globalAlpha = Math.min(1, sinceFirst / dot.appearMs);
      }
      context.fillStyle = dot.highlight ? DOT_FIELD.highlightColor : DOT_FIELD.color;
      context.fillRect(dot.x, dot.y, size, size);
    }
    context.globalAlpha = 1;
  };

  const tick = (now: number): void => {
    // After a pause (off screen, hidden tab) the first step is one frame, not a leap.
    const dt =
      lastStep === 0 ? 1 : Math.min(DOT_FIELD.maxStepFrames, (now - lastStep) / DOT_FIELD.frameMs);
    lastStep = now;
    if (firstFrame === 0) firstFrame = now;
    step(now, dt);
    draw(now);
    frame = onScreen && !document.hidden ? requestAnimationFrame(tick) : 0;
    if (frame === 0) lastStep = 0;
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
      if (Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y) > DOT_FIELD.stillPx * scale) {
        anchor.x = pointer.x;
        anchor.y = pointer.y;
        anchor.at = event.timeStamp;
      }
    });
    host.addEventListener('pointerleave', () => {
      pointer.x = OFF_SCREEN;
      pointer.y = OFF_SCREEN;
    });
  }
  resume();
}
