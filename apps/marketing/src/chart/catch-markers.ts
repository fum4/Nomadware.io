// The activity chart's caught-issue markers: where each sits on the trace and how big it is. Pure:
// no DOM, so it is unit-tested (stats-chart.astro renders them).
import { STATS_CHART } from '../constants';
import { pointAt } from './trace-geometry';

export interface CatchMarker {
  /** The bucket, and its point on the trace as shares of the plot (0,0 = top left). */
  index: number;
  x: number;
  y: number;
  /** Its diameter over a single issue's: the area grows with the count, up to a cap. */
  scale: number;
}

/** A marker per bucket that caught issues, on the trace through `trace`. */
export function catchMarkers(trace: readonly number[], caught: readonly number[]): CatchMarker[] {
  const { markerAreaPerIssue, markerMaxArea } = STATS_CHART;
  return caught.flatMap((count, index) => {
    if (count === 0) return [];
    const area = Math.min(markerMaxArea, 1 + (count - 1) * markerAreaPerIssue);
    return [{ index, scale: Math.sqrt(area), ...pointAt(trace, index) }];
  });
}
