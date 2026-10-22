import { TAGS_FLICKER } from '../constants';
import { flashFallbackFadeMs, flashingAllowed } from './motion-policy';

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

/**
 * Off → a few irregular on/off steps (some with a glow) → steady on. Random per element and per
 * load, so no two tags stutter alike.
 */
function flickerKeyframes(): Keyframe[] {
  const steps = Math.round(between(TAGS_FLICKER.stepsMin, TAGS_FLICKER.stepsMax));
  const keyframes: Keyframe[] = [{ offset: 0, opacity: 0, textShadow: NO_GLOW, easing: STEP }];
  for (let index = 0; index < steps; index += 1) {
    const lit = index % 2 === 0;
    keyframes.push({
      offset: (index + between(0.6, 1.2)) / (steps + 1),
      opacity: lit ? between(0.55, 1) : between(0.05, 0.35),
      textShadow: lit && Math.random() < 0.5 ? GLOW : NO_GLOW,
      easing: STEP,
    });
  }
  keyframes.push({ offset: 1, opacity: 1, textShadow: NO_GLOW });
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
 * resolves when it is steady, left at full opacity with no animation attached. It flashes, so
 * under reduced motion it is a plain fade at once instead (scripts/motion-policy.ts).
 */
export async function powerOn(
  element: HTMLElement,
  delay: number,
  duration: number,
): Promise<void> {
  const animation = flashingAllowed()
    ? element.animate(flickerKeyframes(), { delay, duration, fill: 'forwards' })
    : element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: flashFallbackFadeMs(),
        easing: 'ease-out',
        fill: 'forwards',
      });
  await animation.finished;
  // Settle explicitly: commitStyles() would freeze a `steps()` segment at its start value.
  element.style.opacity = '1';
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
