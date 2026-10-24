// TEMPORARY (NWARE-82): dev-only switches to bisect the iOS scroll jitter on a real phone.
// `?off=a,b` turns suspects off (`all` = every one); read once at startup. Production builds
// ignore the parameter: import.meta.env.DEV is false there, so every switch reads "on".

export type BisectSwitch =
  | 'switcher'
  | 'dots'
  | 'band'
  | 'spread'
  | 'smooth'
  | 'grain'
  | 'halo'
  | 'keyboard'
  | 'intro'
  | 'consent';

/** The switches a query string turns off (server render and client share it). */
export function parseOff(search: string): ReadonlySet<string> {
  if (!import.meta.env.DEV) return new Set();
  const value = new URLSearchParams(search).get('off') ?? '';
  return new Set(value.split(',').map((name) => name.trim()));
}

const OFF = typeof location === 'undefined' ? new Set<string>() : parseOff(location.search);

/** Whether `name` is switched off for this page load. */
export function bisectOff(name: BisectSwitch, off: ReadonlySet<string> = OFF): boolean {
  return off.has(name) || off.has('all');
}

/** The CSS-only suspects, switched off with one injected style sheet. */
const CSS_OFF: Partial<Record<BisectSwitch, string>> = {
  smooth: 'html { scroll-behavior: auto !important; }',
  grain: '.frame::after { display: none !important; }',
  halo: '.frame::before { display: none !important; }',
  // The consent card: fixed, with a backdrop blur, shown on the first scroll of every new origin.
  consent: '[data-consent] { display: none !important; }',
};

const measures = new Map<string, number>();

/** Counts one re-measure by a layout script (dev only), for the `?probe` readout. */
export function countMeasure(name: string): void {
  if (!import.meta.env.DEV) return;
  measures.set(name, (measures.get(name) ?? 0) + 1);
}

/** Every layout script's re-measures so far, by name. */
export const measureCounts = (): ReadonlyMap<string, number> => measures;

/** `?probe`: the live viewport readout (scripts/viewport-probe.ts). */
export const probeOn = (search: string): boolean =>
  import.meta.env.DEV && new URLSearchParams(search).has('probe');

export function applyBisectStyles(): void {
  const rules = Object.entries(CSS_OFF)
    .filter(([name]) => OFF.has(name) || OFF.has('all'))
    .map(([, rule]) => rule);
  if (rules.length === 0) return;
  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.append(style);
}
