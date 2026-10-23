import { WORDMARK_LETTER_DELAY_S, WORDMARK_LETTER_STAGGER_S } from '../constants';

const OPEN_CLASS = 'is-open';

/** "nware" → "nomadware", now (the intro sequence picks the moment). */
export function expandWordmark(): void {
  const unfold = document.querySelector<HTMLElement>('[data-wordmark-unfold]');
  if (!unfold) return;
  const letters = [...unfold.querySelectorAll<HTMLElement>('i')];

  const width = letters.reduce((sum, letter) => sum + letter.offsetWidth, 0);
  unfold.style.width = `${width}px`;
  letters.forEach((letter, index) => {
    letter.style.transitionDelay = `${WORDMARK_LETTER_DELAY_S + index * WORDMARK_LETTER_STAGGER_S}s`;
  });
  unfold.classList.add(OPEN_CLASS);
  // Hand the width back to layout so a later font swap can't clip a letter.
  const release = (event: TransitionEvent): void => {
    if (event.target !== unfold || event.propertyName !== 'width') return;
    unfold.style.width = 'auto';
    unfold.removeEventListener('transitionend', release);
  };
  unfold.addEventListener('transitionend', release);
}
