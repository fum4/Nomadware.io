import { describe, expect, it } from 'vitest';

import type { Body } from './dot-separation';
import { SeparationGrid } from './dot-separation';

const body = (x: number, y: number): Body => ({ x, y, vx: 0, vy: 0 });

describe('SeparationGrid', () => {
  it('pushes a close pair apart, equal and opposite, stronger the closer they are', () => {
    const near = [body(100, 100), body(104, 100)];
    const far = [body(100, 100), body(108, 100)];
    new SeparationGrid().separate(near, () => 10, 10, 1);
    new SeparationGrid().separate(far, () => 10, 10, 1);
    expect(near[0]?.vx).toBeCloseTo(-0.6);
    expect(near[1]?.vx).toBeCloseTo(0.6);
    expect(near[0]?.vy).toBe(0);
    expect(far[1]?.vx).toBeCloseTo(0.2);
  });

  it('leaves pairs at or beyond the radius alone, across cell borders too', () => {
    const bodies = [body(9, 9), body(19, 9), body(9, 30)];
    new SeparationGrid().separate(bodies, () => 10, 10, 1);
    expect(bodies.every((each) => each.vx === 0 && each.vy === 0)).toBe(true);
  });

  it('finds neighbours in the adjacent cell', () => {
    const bodies = [body(9.5, 5), body(10.5, 5)];
    new SeparationGrid().separate(bodies, () => 10, 10, 1);
    expect(bodies[1]?.vx).toBeCloseTo(0.9);
  });

  it('uses the larger radius of the pair', () => {
    const bodies = [body(0, 0), body(15, 0)];
    new SeparationGrid().separate(bodies, (index) => (index === 0 ? 5 : 30), 30, 1);
    expect(bodies[1]?.vx).toBeCloseTo(0.5);
  });

  it('parts two dots on the same spot without NaN', () => {
    const bodies = [body(50, 50), body(50, 50)];
    new SeparationGrid().separate(bodies, () => 10, 10, 1);
    expect(bodies[0]?.vx).toBe(1);
    expect(bodies[1]?.vx).toBe(-1);
  });

  it('reuses its buckets: a second frame sees the bodies where they are now', () => {
    const grid = new SeparationGrid();
    const bodies = [body(0, 0), body(5, 0)];
    grid.separate(bodies, () => 10, 10, 1);
    const [first, second] = bodies;
    if (!first || !second) throw new Error('fixture');
    Object.assign(first, { x: 500, vx: 0 });
    Object.assign(second, { vx: 0 });
    grid.separate(bodies, () => 10, 10, 1);
    expect(second.vx).toBe(0);
  });
});
