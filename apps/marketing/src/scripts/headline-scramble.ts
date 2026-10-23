import { SCRAMBLE_GLYPHS, SCRAMBLE_STEP_MS } from '../constants';

const SCRAMBLING = 'is-scrambling';
const OVERLAY = 'scramble-glyphs';

const randomGlyph = (): string =>
  SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)] ?? '';

/**
 * Decode the headline left to right, once; resolves when the text has settled. The real text node
 * is never touched, so its glyphs sit exactly where they will stay: it is painted only up to the
 * reveal point (a background clipped to the text), and the pending letters are covered by glyphs
 * in an aria-hidden overlay, positioned from the text's own character boxes. Readers, crawlers and
 * `textContent` only ever see the real text. `onProgress` hears the revealed share (0–1) at
 * every step.
 */
export function scrambleHeadline(onProgress?: (share: number) => void): Promise<void> {
  const target = document.querySelector<HTMLElement>('[data-scramble]');
  const text = target?.firstChild;
  if (!target || !(text instanceof Text)) return Promise.resolve();

  const ink = getComputedStyle(target).color;
  const range = document.createRange();
  const boxesOf = (start: number, end: number): DOMRect[] => {
    range.setStart(text, start);
    range.setEnd(text, end);
    return [...range.getClientRects()];
  };
  const overlay = document.createElement('span');
  overlay.className = OVERLAY;
  overlay.setAttribute('aria-hidden', 'true');
  const glyphs = [...text.data].map((char) => {
    if (/\s/.test(char)) return null;
    const glyph = document.createElement('span');
    overlay.append(glyph);
    return glyph;
  });
  target.classList.add(SCRAMBLING);
  target.append(overlay);

  // Re-measured every step: a web font swapping in mid-decode moves the boxes.
  const paint = (revealed: number): void => {
    const origin = target.getBoundingClientRect();
    const shown = revealed > 0 ? boxesOf(0, revealed) : [];
    target.style.backgroundImage =
      shown.map(() => `linear-gradient(${ink}, ${ink})`).join(', ') || 'none';
    target.style.backgroundSize = shown.map((box) => `${box.width}px ${box.height}px`).join(', ');
    target.style.backgroundPosition = shown
      .map((box) => `${box.left - origin.left}px ${box.top - origin.top}px`)
      .join(', ');
    glyphs.forEach((glyph, index) => {
      if (!glyph) return;
      const box = boxesOf(index, index + 1)[0];
      glyph.hidden = index < revealed || !box;
      if (!box || glyph.hidden) return;
      glyph.dataset.glyph = randomGlyph();
      glyph.style.left = `${box.left - origin.left}px`;
      glyph.style.top = `${box.top - origin.top}px`;
      glyph.style.lineHeight = `${box.height}px`;
    });
  };

  return new Promise((resolve) => {
    let revealed = 0;
    const step = (): void => {
      if (revealed > text.length) {
        clearInterval(timer);
        overlay.remove();
        target.removeAttribute('style');
        target.classList.remove(SCRAMBLING);
        resolve();
        return;
      }
      paint(revealed);
      onProgress?.(revealed / text.length);
      revealed += 1;
    };
    const timer = setInterval(step, SCRAMBLE_STEP_MS);
    step();
  });
}
