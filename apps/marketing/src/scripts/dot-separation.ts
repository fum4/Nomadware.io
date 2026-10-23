// Short-range repulsion between the hero dots (scripts/dot-field.ts): what packs a gathered clump
// into an even disc and, once released, spreads it back out. Pure (no DOM), so it is unit-tested.

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Packs a cell (x, y ≥ 0, far below 2^16) into one map key. */
const CELL_KEY_STRIDE = 65_536;

/**
 * Bucket grid for neighbour lookups: cells as wide as the largest separation radius, so every
 * pair that can touch sits in the same or an adjacent cell. Its arrays are reused frame to frame.
 */
export class SeparationGrid {
  private readonly cells = new Map<number, number[]>();

  /**
   * Push apart every pair of bodies closer than the larger of their two radii (`radiusOf`, never
   * above `maxRadius`): each gains `force × (1 − distance / radius)` along the line between them,
   * equal and opposite, so the pair's momentum is kept. Linear falloff: no kick at the edge.
   */
  separate(
    bodies: readonly Body[],
    radiusOf: (index: number) => number,
    maxRadius: number,
    force: number,
  ): void {
    for (const cell of this.cells.values()) cell.length = 0;
    const cellOf = (value: number): number => Math.max(0, Math.floor(value / maxRadius));
    bodies.forEach((body, index) => {
      const key = cellOf(body.x) * CELL_KEY_STRIDE + cellOf(body.y);
      const cell = this.cells.get(key);
      if (cell) cell.push(index);
      else this.cells.set(key, [index]);
    });

    bodies.forEach((body, index) => {
      const cx = cellOf(body.x);
      const cy = cellOf(body.y);
      const ownRadius = radiusOf(index);
      for (let nx = cx - 1; nx <= cx + 1; nx += 1) {
        for (let ny = cy - 1; ny <= cy + 1; ny += 1) {
          if (nx < 0 || ny < 0) continue;
          for (const other of this.cells.get(nx * CELL_KEY_STRIDE + ny) ?? []) {
            // Each pair once.
            if (other <= index) continue;
            const neighbour = bodies[other];
            if (!neighbour) continue;
            const dx = body.x - neighbour.x;
            const dy = body.y - neighbour.y;
            const radius = Math.max(ownRadius, radiusOf(other));
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared >= radius * radius) continue;
            const distance = Math.sqrt(distanceSquared);
            // Two dots on the same spot: part them along a fixed axis instead of dividing by 0.
            const ux = distance > 0 ? dx / distance : 1;
            const uy = distance > 0 ? dy / distance : 0;
            const push = force * (1 - distance / radius);
            body.vx += ux * push;
            body.vy += uy * push;
            neighbour.vx -= ux * push;
            neighbour.vy -= uy * push;
          }
        }
      }
    });
  }
}
