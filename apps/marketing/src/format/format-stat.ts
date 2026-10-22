import type { StatKey } from '../data/stats-snapshot';

const COMPACT_KEYS: ReadonlySet<StatKey> = new Set<StatKey>([
  'actions',
  'linesAdded',
  'linesDeleted',
]);
const THOUSAND = 1_000;
const WHOLE_THOUSANDS_FROM = 100_000;

/**
 * How a stat reads on the page: big counts compact to "14.7k" / "112k", the rest grouped "1,532".
 * Shared by the server render and the count-up so both print the same string for the same value.
 */
export function formatStat(key: StatKey, value: number): string {
  if (COMPACT_KEYS.has(key) && value >= THOUSAND) {
    const digits = value >= WHOLE_THOUSANDS_FROM ? 0 : 1;
    return `${(value / THOUSAND).toFixed(digits).replace(/\.0$/, '')}k`;
  }
  return Math.round(value).toLocaleString('en-US');
}
