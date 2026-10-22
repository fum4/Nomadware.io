import { SCRAMBLE_GLYPHS, SCRAMBLE_STEP_MS } from '../constants';
import { prefersReducedMotion } from './motion';

const randomGlyph = (): string =>
  SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)] ?? '';

/**
 * Decode the headline left to right, once. Each pending letter keeps its own width (transparent)
 * under a glyph overlay, so the line never reflows; screen readers get the plain text throughout.
 */
export function initHeadlineScramble(): void {
  const target = document.querySelector<HTMLElement>('[data-scramble]');
  if (!target || prefersReducedMotion()) return;
  const text = target.textContent ?? '';

  const spoken = document.createElement('span');
  spoken.className = 'sr-only';
  spoken.textContent = text;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  const letters = [...text].map((char) => {
    const letter = document.createElement('span');
    letter.textContent = char;
    return letter;
  });
  shown.append(...letters);
  target.replaceChildren(spoken, shown);

  let revealed = 0;
  const step = (): void => {
    letters.forEach((letter, index) => {
      const pending = index >= revealed && letter.textContent !== ' ';
      letter.classList.toggle('scrambled', pending);
      if (pending) letter.dataset.glyph = randomGlyph();
    });
    revealed += 1;
    if (revealed > letters.length) {
      clearInterval(timer);
      target.textContent = text;
    }
  };
  const timer = setInterval(step, SCRAMBLE_STEP_MS);
  step();
}
