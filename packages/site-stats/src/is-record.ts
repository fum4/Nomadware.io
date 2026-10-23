/** A plain JSON object (not null, not an array): the first check on any untrusted value. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
