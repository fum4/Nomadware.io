import { TAGS_FLICKER } from '../constants';

const GLOW = '0 0 6px currentColor';
const NO_GLOW = 'none';
/** Hold each step, then jump: a failing tube, not a fade. */
const STEP = 'steps(1, end)';

const between = (min: number, max: number): number => min + Math.random() * (max - min);

interface Flicker {
  element: HTMLElement;
  start: number;
  duration: number;
}

/** `lit` at `alpha` (0–1): the colour the word shows at one step of its flicker. */
const dimmed = (lit: string, alpha: number): string =>
  `color-mix(in srgb, ${lit} ${(alpha * 100).toFixed(1)}%, transparent)`;

/**
 * Off → a few irregular on/off steps (some with a glow) → steady on, ending on `lit`, the
 * element's own colour. Random per element and per load, so no two tags stutter alike.
 *
 * Only colour and text-shadow, never opacity (or transform/filter): those are compositor
 * properties, so each run gives the element a compositing layer of its own for ~250 ms. On a
 * phone that layer coming and going re-layered the page around it at every swap: the tags line
 * jumped a hair down and back, and the film grain's overlay blend (global.css `.frame::after`)
 * darkened the whole page for the flicker's length. A colour step only repaints the word.
 */
export function flickerKeyframes(lit: string): Keyframe[] {
  const steps = Math.round(between(TAGS_FLICKER.stepsMin, TAGS_FLICKER.stepsMax));
  const keyframes: Keyframe[] = [
    { offset: 0, color: dimmed(lit, 0), textShadow: NO_GLOW, easing: STEP },
  ];
  for (let index = 0; index < steps; index += 1) {
    const on = index % 2 === 0;
    keyframes.push({
      offset: (index + between(0.6, 1.2)) / (steps + 1),
      color: dimmed(lit, on ? between(0.55, 1) : between(0.05, 0.35)),
      textShadow: on && Math.random() < 0.5 ? GLOW : NO_GLOW,
      easing: STEP,
    });
  }
  keyframes.push({ offset: 1, color: lit, textShadow: NO_GLOW });
  return keyframes;
}

/** Tags one after another; each slash lights a beat after both of its neighbours have started. */
function schedule(tags: HTMLElement[], slashes: HTMLElement[]): Flicker[] {
  const flickers: Flicker[] = [];
  let start = 0;
  tags.forEach((element, index) => {
    if (index > 0) start += between(TAGS_FLICKER.staggerMinMs, TAGS_FLICKER.staggerMaxMs);
    const duration = flickerDuration();
    flickers.push({ element, start, duration });
    const slash = slashes[index - 1];
    if (slash) {
      flickers.push({
        element: slash,
        start: start + between(TAGS_FLICKER.slashLagMinMs, TAGS_FLICKER.slashLagMaxMs),
        duration: duration * TAGS_FLICKER.slashDurationShare,
      });
    }
  });
  // Squeeze the whole run into the budget: the intro's gap must not grow.
  const end = Math.max(...flickers.map((flicker) => flicker.start + flicker.duration));
  const scale = Math.min(1, TAGS_FLICKER.budgetMs / end);
  flickers.forEach((flicker) => {
    flicker.start *= scale;
    flicker.duration *= scale;
  });
  return flickers;
}

/** One power-on flicker's length, random per run. */
export const flickerDuration = (): number =>
  between(TAGS_FLICKER.durationMinMs, TAGS_FLICKER.durationMaxMs);

/**
 * Switch one element on from dark like a neon tube with a bad power supply, after `delay` ms;
 * resolves when it is steady, in its own colour with no animation attached. Plays under reduced
 * motion too (owner's call; README § Motion).
 */
export async function powerOn(
  element: HTMLElement,
  delay: number,
  duration: number,
): Promise<void> {
  // Drop the CSS hold that keeps it dark until lit (hero.astro), so its own colour is readable;
  // the animation below takes over within the same task, so the word never paints lit early.
  element.style.animation = 'none';
  const lit = getComputedStyle(element).color;
  const animation = element.animate(flickerKeyframes(lit), { delay, duration, fill: 'both' });
  await animation.finished;
  // Ends on its own colour: nothing to commit, so no inline style is left behind.
  animation.cancel();
}

/**
 * Power the hero tags on, one after another; resolves when all are lit. They are hidden by CSS
 * until now (only with JS; see hero.astro).
 */
export async function flickerTags(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-tags]');
  if (!root) return;
  const tags = [...root.querySelectorAll<HTMLElement>('[data-tag]')];
  const slashes = [...root.querySelectorAll<HTMLElement>('[data-slash]')];
  await Promise.all(
    schedule(tags, slashes).map(({ element, start, duration }) =>
      powerOn(element, start, duration),
    ),
  );
}
