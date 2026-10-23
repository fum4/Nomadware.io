// The activity chart's geometry, shared by the server render (the trace) and the hover tooltip
// (snapping, the dot, the chip's place). Pure: no DOM, so it is unit-tested.

/** An SVG path through `values`, scaled into a width × height box (y grows down; the largest touches the top). */
export function linePath(values: readonly number[], width: number, height: number): string {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (height - (value / max) * height).toFixed(1);
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

/** Where point `index` sits in the plot, as shares of its width and height (0,0 = top left). */
export function pointAt(values: readonly number[], index: number): { x: number; y: number } {
  const max = Math.max(1, ...values);
  return {
    x: values.length > 1 ? index / (values.length - 1) : 0,
    y: 1 - (values[index] ?? 0) / max,
  };
}

/** The point nearest a pointer at `share` of the plot's width (clamped onto the plot). */
export function nearestIndex(share: number, count: number): number {
  if (count < 2) return 0;
  return Math.round(Math.min(1, Math.max(0, share)) * (count - 1));
}

/**
 * The chip's left edge, centred on a point at `x` and pushed back inside `bounds` (where both
 * fit; on a box narrower than the chip, its left edge wins). All lengths in the same px space.
 */
export function centreChip(
  x: number,
  chipWidth: number,
  bounds: { left: number; right: number },
): number {
  return Math.max(bounds.left, Math.min(x - chipWidth / 2, bounds.right - chipWidth));
}
