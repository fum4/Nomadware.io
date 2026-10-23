// The stats legend counted in step with the trace's draw: as the pen reaches each point, every
// number adds that bucket's share. Pure: no DOM, so it is unit-tested (scripts/stats-card.ts
// paints it, scripts/trace-draw.ts reveals the caught markers with the same `pointsReached`).
import type { SeriesCounts, StatKey, StatSeries } from '@nomadware/site-stats';

const MINUTES_PER_HOUR = 60;
/** Float slack, so a pen at exactly a point's share counts as having reached it. */
const REACH_EPSILON = 1e-9;

/** The series each legend number counts along, and how many series units make one of its own. */
const LEGEND_SERIES: Partial<Record<StatKey, { key: SeriesCounts; perUnit: number }>> = {
  prs: { key: 'prsMerged', perUnit: 1 },
  runs: { key: 'runs', perUnit: 1 },
  agentHours: { key: 'agentMinutes', perUnit: MINUTES_PER_HOUR },
  actions: { key: 'actions', perUnit: 1 },
  checks: { key: 'checks', perUnit: 1 },
  caught: { key: 'caught', perUnit: 1 },
};

/**
 * How many of a `count`-point trace's points a pen at `reach` (share of the plot's width, 0–1)
 * has passed: point i sits at i / (count - 1), and the pen passes it on arriving there.
 */
export function pointsReached(reach: number, count: number): number {
  if (reach < 0) return 0;
  if (count < 2) return count;
  return Math.min(count, Math.floor(reach * (count - 1) + REACH_EPSILON) + 1);
}

/**
 * Stat `key`'s value with the pen at `reach`: 0 at the start, `total` at the end. From the second
 * point on, each bucket steps in as the pen reaches its point, so a flat stretch holds and a spike
 * climbs fast. What comes before that — the first bucket, plus whatever the window counts beyond
 * the series (it starts before the first bucket; hours round on their own) — ramps in as the pen
 * draws the first segment, so no number starts ahead of the line. A count then steps exactly as
 * its buckets do (one caught issue per marker). No series for the stat: the count follows the pen.
 */
export function countAlong(
  key: StatKey,
  total: number,
  series: StatSeries | undefined,
): (reach: number) => number {
  const source = LEGEND_SERIES[key];
  const values = source && series ? series[source.key] : undefined;
  if (!source || !values) return (reach) => total * Math.min(1, Math.max(0, reach));
  const reached = [0];
  let sum = 0;
  for (const value of values) {
    sum += value / source.perUnit;
    reached.push(sum);
  }
  const before = total - sum;
  const atFirstPoint = before + (reached[1] ?? 0);
  return (reach) => {
    const passed = pointsReached(reach, values.length);
    if (passed === values.length) return total;
    if (passed > 1) return Math.max(0, before + (reached[passed] ?? 0));
    const firstSegment = Math.min(1, Math.max(0, reach * (values.length - 1)));
    return Math.max(0, atFirstPoint * firstSegment);
  };
}
