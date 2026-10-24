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
  | 'intro';

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
};

export function applyBisectStyles(): void {
  const rules = Object.entries(CSS_OFF)
    .filter(([name]) => OFF.has(name) || OFF.has('all'))
    .map(([, rule]) => rule);
  if (rules.length === 0) return;
  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.append(style);
}
