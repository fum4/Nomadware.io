const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "just now" · "4m ago" · "2h ago" · "3d ago" — coarse on purpose, it is a freshness hint. */
export function relativeTime(fromIso: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(fromIso));
  if (elapsed < MINUTE_MS) return 'just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  return `${Math.floor(elapsed / DAY_MS)}d ago`;
}
