// The activity chart's geometry, shared by the server render (the trace, the peak) and the hover
// tooltip (snapping, the chip's place). Pure: no DOM, so it is unit-tested.

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

/** Index and value of the largest point (the first one on a tie). */
export function peakOf(values: readonly number[]): { index: number; value: number } {
  return values.reduce((peak, value, index) => (value > peak.value ? { index, value } : peak), {
    index: 0,
    value: values[0] ?? 0,
  });
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

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The chip's top-left corner for a point at (`x`, `y`): beside it, `gap` to the right, or to the
 * left when it would leave `bounds` there; vertically centred on it, pushed back inside `bounds`.
 * All lengths in the same px space.
 */
export function placeChip(
  point: { x: number; y: number },
  chip: { width: number; height: number },
  bounds: Box,
  gap: number,
): { left: number; top: number } {
  const right = point.x + gap;
  const left =
    right + chip.width <= bounds.right ? right : Math.max(bounds.left, point.x - gap - chip.width);
  const centred = point.y - chip.height / 2;
  const top = Math.min(Math.max(bounds.top, centred), bounds.bottom - chip.height);
  return { left, top };
}
