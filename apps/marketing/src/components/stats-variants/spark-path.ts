// TEMPORARY (NWARE-82), stats variants a/d: an SVG path through `values`, scaled into a
// width × height box (y grows down; the largest value touches the top).

export function linePath(values: number[], width: number, height: number): string {
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

/** The same line closed down to the baseline, for a filled area under it. */
export function areaPath(values: number[], width: number, height: number): string {
  return `${linePath(values, width, height)} L${width} ${height} L0 ${height} Z`;
}

/** Index and value of the largest point. */
export function peakOf(values: number[]): { index: number; value: number } {
  return values.reduce((peak, value, index) => (value > peak.value ? { index, value } : peak), {
    index: 0,
    value: values[0] ?? 0,
  });
}
