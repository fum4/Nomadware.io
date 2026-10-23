// The activity chart's words: the peak callout (server) and the hover tooltip (browser) print
// through these, so both read the same. Times are the visitor's own zone unless `timeZone` says.

const LOCALE = 'en-GB';
const MINUTES_PER_HOUR = 60;

/** "1h 40m", "2h", "40m". */
export function formatAgentTime(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = Math.round(minutes % MINUTES_PER_HOUR);
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "Wed 21 Oct · 14:00–16:00": the day the bucket starts, and its hours. */
export function formatBucketRange(startMs: number, endMs: number, timeZone?: string): string {
  const day = new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  });
  const time = new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  return `${day.format(startMs).replace(',', '')} · ${time.format(startMs)}–${time.format(endMs)}`;
}

/** "1,240" — the site's grouping (format-stat.ts prints full numbers the same way). */
export const formatCount = (value: number): string => Math.round(value).toLocaleString('en-US');

/** "2 PRs merged", "1 PR merged". */
export const formatPrsMerged = (count: number): string =>
  `${formatCount(count)} ${count === 1 ? 'PR' : 'PRs'} merged`;
