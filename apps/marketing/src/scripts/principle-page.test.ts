import { describe, expect, it } from 'vitest';

import { nextPage } from './principle-page';

const H = 0.06;

describe('nextPage', () => {
  it('maps a position well inside a page to that page', () => {
    expect(nextPage(0.5, 0, 3, H)).toBe(0);
    expect(nextPage(1.5, 0, 3, H)).toBe(1);
    expect(nextPage(2.5, 1, 3, H)).toBe(2);
  });

  it('holds the current page until the scroll is past the boundary by the hysteresis', () => {
    expect(nextPage(1.03, 0, 3, H)).toBe(0);
    expect(nextPage(1.07, 0, 3, H)).toBe(1);
    expect(nextPage(0.97, 1, 3, H)).toBe(1);
    expect(nextPage(0.93, 1, 3, H)).toBe(0);
  });

  it('keeps the last page at the end of the track and the first before it', () => {
    expect(nextPage(3, 2, 3, H)).toBe(2);
    expect(nextPage(3, 0, 3, H)).toBe(2);
    expect(nextPage(0, 2, 3, H)).toBe(0);
  });

  it('jumps straight across pages on a long scroll', () => {
    expect(nextPage(2.5, 0, 3, H)).toBe(2);
    expect(nextPage(0.2, 2, 3, H)).toBe(0);
  });
});
