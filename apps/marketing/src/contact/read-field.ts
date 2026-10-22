/** One property of an untrusted JSON value, still unknown; undefined when it isn't an object. */
export const readField = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null && Object.hasOwn(value, key)
    ? (value as Record<string, unknown>)[key]
    : undefined;
