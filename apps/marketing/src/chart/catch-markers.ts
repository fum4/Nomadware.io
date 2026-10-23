// The activity chart's caught-issue markers: where each sits on the trace, and which counts would
// crowd each other on a narrow plot. Pure: no DOM, so it is unit-tested (stats-chart.astro renders).
import { pointAt } from './trace-geometry';

export interface CatchMarker {
  /** The bucket, and its point on the trace as shares of the plot (0,0 = top left). */
  index: number;
  x: number;
  y: number;
  count: number;
  /** A larger count sits within the label gap: on a narrow plot, this one's count hides. */
  crowded: boolean;
}

/**
 * A marker per bucket that caught issues, on the trace through `trace`. Counts claim their place
 * largest first (earlier on a tie): one closer than `labelGapShare` of the plot's width to a count
 * already placed is crowded. Only counts of 2 or more show, so only they claim a place.
 */
export function catchMarkers(
  trace: readonly number[],
  caught: readonly number[],
  labelGapShare: number,
): CatchMarker[] {
  const markers = caught.flatMap((count, index) =>
    count > 0 ? [{ index, count, crowded: false, ...pointAt(trace, index) }] : [],
  );
  const placed: number[] = [];
  markers
    .filter((marker) => marker.count > 1)
    .toSorted((a, b) => b.count - a.count || a.index - b.index)
    .forEach((marker) => {
      marker.crowded = placed.some((x) => Math.abs(x - marker.x) < labelGapShare);
      if (!marker.crowded) placed.push(marker.x);
    });
  return markers;
}
