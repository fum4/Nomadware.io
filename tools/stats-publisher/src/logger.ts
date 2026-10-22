// logfmt lines on stderr (journald keeps them per run; stdout is reserved for `compute`'s JSON).
// Never pass a credential or a repo/session name: these lines land in the user journal.

type Level = 'info' | 'warn' | 'error';
type Field = string | number | boolean;

function format(value: Field): string {
  const text = String(value);
  return /^[\w.:/+-]+$/.test(text) ? text : JSON.stringify(text);
}

export function log(level: Level, message: string, fields: Record<string, Field> = {}): void {
  const pairs = Object.entries(fields).map(([key, value]) => `${key}=${format(value)}`);
  process.stderr.write(`level=${level} msg=${format(message)} ${pairs.join(' ')}`.trimEnd() + '\n');
}
