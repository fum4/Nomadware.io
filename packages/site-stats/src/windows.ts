// The rolling windows every stat and series is reported for, ending at the snapshot's generatedAt.

export const STAT_WINDOWS = ['7d', '30d'] as const;
export type StatWindow = (typeof STAT_WINDOWS)[number];

/** Window length in days, by window. */
export const STAT_WINDOW_DAYS: Readonly<Record<StatWindow, number>> = { '7d': 7, '30d': 30 };

export function isStatWindow(value: string | undefined): value is StatWindow {
  return STAT_WINDOWS.some((window) => window === value);
}
