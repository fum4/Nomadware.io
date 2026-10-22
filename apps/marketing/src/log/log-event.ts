// The server's one log sink: one JSON line per event, which Vercel's runtime logs keep as-is.
// Fields are for codes, counts and statuses — never a visitor's name, address, IP or message.

type LogLevel = 'info' | 'warn' | 'error';
type LogValue = string | number | boolean | null;

export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, LogValue> = {},
): void {
  const line = JSON.stringify({ level, event, ...fields });
  // oxlint-disable-next-line no-console -- this module is the sanctioned sink every log goes through
  console[level](line);
}
