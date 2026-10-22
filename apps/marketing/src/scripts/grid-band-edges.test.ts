import { describe, expect, it } from 'vitest';

import { bandEdges } from './grid-band-edges';

const GRID = 64;
const LINE = 1;

describe('bandEdges', () => {
  it('puts both edges on grid lines (top just below one, bottom on one)', () => {
    const { top, bottom } = bandEdges(901.3, 1492.7, GRID, LINE);
    expect((top - LINE) % GRID).toBe(0);
    expect(bottom % GRID).toBe(0);
  });

  it('keeps every content-to-edge gap in [one cell, two cells)', () => {
    for (let offset = 0; offset < GRID; offset += 0.25) {
      const contentTop = 640 + offset;
      const contentBottom = 1280 + offset;
      const { top, bottom } = bandEdges(contentTop, contentBottom, GRID, LINE);
      expect(contentTop - (top - LINE)).toBeGreaterThanOrEqual(GRID - 0.5);
      expect(contentTop - (top - LINE)).toBeLessThan(2 * GRID);
      expect(bottom - contentBottom).toBeGreaterThanOrEqual(GRID - 0.5);
      expect(bottom - contentBottom).toBeLessThan(2 * GRID);
    }
  });

  it('uses the line exactly one cell away when the content sits on a line', () => {
    expect(bandEdges(768, 1472, GRID, LINE)).toEqual({ top: 704 + LINE, bottom: 1536 });
  });

  it('grows the bottom by a whole cell once the content passes a line', () => {
    expect(bandEdges(768, 1472.5, GRID, LINE).bottom).toBe(1536);
    expect(bandEdges(768, 1473, GRID, LINE).bottom).toBe(1600);
  });
});
