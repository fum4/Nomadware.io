// The activity chart's geometry, shared by the server render (the trace) and the hover tooltip
// (snapping, the dot, the chip's place). Pure: no DOM, so it is unit-tested.

/**
 * The trace through `values` as two SVG paths, scaled into a width × height box (y grows down;
 * the largest touches the top): `active` = every segment touching some activity, `quiet` = the
 * runs between two empty buckets, drawn apart so an idle stretch reads as quiet, not as a signal.
 */
export function tracePaths(
  values: readonly number[],
  width: number,
  height: number,
): { active: string; quiet: string } {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const point = (index: number): string =>
    `${(index * step).toFixed(1)} ${(height - ((values[index] ?? 0) / max) * height).toFixed(1)}`;
  const paths = { active: [] as string[], quiet: [] as string[] };
  let open: keyof typeof paths | undefined;
  for (let index = 1; index < values.length; index += 1) {
    const kind = values[index - 1] === 0 && values[index] === 0 ? 'quiet' : 'active';
    if (kind !== open) paths[kind].push(`M${point(index - 1)}`);
    paths[kind].push(`L${point(index)}`);
    open = kind;
  }
  return { active: paths.active.join(' '), quiet: paths.quiet.join(' ') };
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

/**
 * The chip's top edge, relative to the plot's: `gap` above the plot, so it never covers the trace
 * (whose peaks touch the plot's top), growing upward over whatever is there. If that would leave
 * the viewport (the plot's top is `plotTop` px into it), it goes `gap` below the plot instead.
 */
export function chipTop(
  chipHeight: number,
  plot: { top: number; height: number },
  gap: number,
  viewportMargin: number,
): number {
  const above = -gap - chipHeight;
  return plot.top + above >= viewportMargin ? above : plot.height + gap;
}
