import { HERO_TAGS } from '../constants';
import { flickerDuration, powerOn } from './tags-flicker';

/**
 * Once the intro is done: every HERO_TAGS.intervalMs, one slot (random, never the same one twice
 * running) powers on the next word of its pool, cycling through the pool before repeating. The
 * slots are sized for their longest word (hero.astro), so a swap never moves anything. Paused
 * while the hero is off screen or the tab is hidden; the line is aria-hidden, so readers never
 * hear a swap.
 */
export function rotateTags(): void {
  const root = document.querySelector<HTMLElement>('[data-tags]');
  const hero = root?.closest('section');
  if (!root || !hero) return;
  const slots = [...root.querySelectorAll<HTMLElement>('[data-tag]')];
  // Each pool's first word is the one already on the page.
  const next = slots.map(() => 1);
  let last = -1;
  let timer = 0;
  let onScreen = true;

  const swap = (): void => {
    timer = 0;
    const choices = slots.map((_, index) => index).filter((index) => index !== last);
    const index = choices[Math.floor(Math.random() * choices.length)] ?? 0;
    const slot = slots[index];
    const pool = HERO_TAGS.pools[index];
    const position = next[index] ?? 0;
    if (slot && pool) {
      slot.textContent = pool[position % pool.length] ?? '';
      next[index] = position + 1;
      void powerOn(slot, 0, flickerDuration());
    }
    last = index;
    resume();
  };

  function resume(): void {
    if (timer === 0 && onScreen && !document.hidden) {
      timer = window.setTimeout(swap, HERO_TAGS.intervalMs);
    }
  }

  const pause = (): void => {
    window.clearTimeout(timer);
    timer = 0;
  };

  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    if (onScreen) resume();
    else pause();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  resume();
}
