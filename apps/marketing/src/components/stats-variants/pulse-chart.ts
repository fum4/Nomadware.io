// TEMPORARY (NWARE-82), stats variant f: everything the pulse chart draws for one window, as
// percentages of the plot box, so markup positions it without measuring.
import type { StatWindow } from '@nomadware/site-stats';

import type { StatsSeries } from '../../data/load-series';
import { linePath, peakOf } from './spark-path';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** Hours per bucket in the preview series (load-series.ts). */
const BUCKET_HOURS: Record<StatWindow, number> = { '7d': 2, '30d': 6 };
/** Day labels: every day for a week, every fifth day for a month. */
const LABEL_EVERY_DAYS: Record<StatWindow, number> = { '7d': 1, '30d': 5 };
const TICK_MAX_PX = 14;
const TICK_MIN_PX = 4;

export interface PulseChart {
  range: StatWindow;
  path: string;
  peak: { x: number; y: number; hours: number; bucketHours: number };
  ticks: { x: number; height: number; count: number }[];
  days: { x: number; label: string }[];
}

const percent = (index: number, count: number): number =>
  count > 1 ? (index / (count - 1)) * 100 : 0;

export function pulseChart(
  series: StatsSeries,
  range: StatWindow,
  width: number,
  height: number,
): PulseChart {
  const minutes = series.agentMinutes[range];
  const merges = series.prsPerBucket[range];
  const peak = peakOf(minutes);
  const maxMinutes = Math.max(1, ...minutes);
  const maxMerges = Math.max(1, ...merges);
  const bucketMs = BUCKET_HOURS[range] * HOUR_MS;
  const end = Date.parse(series.generatedAt);
  const start = end - minutes.length * bucketMs;
  const span = end - start;

  const days: PulseChart['days'] = [];
  const every = LABEL_EVERY_DAYS[range];
  for (let day = Math.ceil(start / DAY_MS) * DAY_MS; day < end; day += DAY_MS) {
    const index = Math.round((day - start) / DAY_MS);
    if (index % every !== 0) continue;
    const date = new Date(day);
    days.push({
      x: ((day - start) / span) * 100,
      label:
        range === '7d'
          ? date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toLowerCase()
          : date
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
              .toLowerCase(),
    });
  }

  return {
    range,
    path: linePath(minutes, width, height),
    peak: {
      x: percent(peak.index, minutes.length),
      y: 100 - (peak.value / maxMinutes) * 100,
      hours: Math.round(peak.value / 60),
      bucketHours: BUCKET_HOURS[range],
    },
    ticks: merges.flatMap((count, index) =>
      count > 0
        ? [
            {
              x: percent(index, merges.length),
              height: TICK_MIN_PX + (count / maxMerges) * (TICK_MAX_PX - TICK_MIN_PX),
              count,
            },
          ]
        : [],
    ),
    days,
  };
}
