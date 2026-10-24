// TEMPORARY (NWARE-82): dev-only switches to bisect the iOS scroll jitter on a real phone.
// `?off=a,b` turns suspects off (`all` = every one); `?jx=a,b` tries a fix (a `jx-<name>` class
// on <html> plus its rules); both read once at startup. Production builds ignore the parameters:
// import.meta.env.DEV is false there, so every switch reads "on" and no experiment runs.

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

/** The experiments `?jx=` turns on. */
export type Experiment = 'nosticky' | 'fit' | 'noclip' | 'layer';

/** The comma-separated names in query parameter `key` (dev only). */
function parseList(search: string, key: string): ReadonlySet<string> {
  if (!import.meta.env.DEV) return new Set();
  const value = new URLSearchParams(search).get(key) ?? '';
  return new Set(value.split(',').map((name) => name.trim()));
}

/** The switches a query string turns off (server render and client share it). */
export const parseOff = (search: string): ReadonlySet<string> => parseList(search, 'off');

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

const STAGE = '[data-principles-stage]';
const TRACK = '[data-principles]';

/** Each experiment's rules (!important: the components' scoped rules are more specific). */
const EXPERIMENTS: Record<Experiment, string> = {
  // Sticky or not: the stage just scrolls with the page.
  nosticky: `${STAGE} { position: relative !important; }`,
  // Not overconstrained: the stage no taller than the smallest visible height (the toolbars up),
  // so it fits its sticky area whatever the toolbars do; what doesn't fit is clipped.
  fit: `${STAGE} { height: calc(var(--visible-h) - 48px) !important; padding-bottom: 0 !important; overflow: hidden !important; }`,
  // No clipping ancestor: the frame's sideways clip moves to the hero (the halo's overhang) and
  // the stage itself.
  noclip: `.frame { overflow-x: visible !important; } .hero { overflow-x: clip; } ${STAGE} { overflow-x: clip; }`,
  // Its own compositing layer: the stage and the track it sticks in.
  layer: `${TRACK}, ${STAGE} { transform: translateZ(0); backface-visibility: hidden; }`,
};

const JX = typeof location === 'undefined' ? new Set<string>() : parseList(location.search, 'jx');

const isExperiment = (name: string): name is Experiment => Object.hasOwn(EXPERIMENTS, name);

export function applyBisectStyles(): void {
  const experiments = [...JX].filter(isExperiment);
  experiments.forEach((name) => document.documentElement.classList.add(`jx-${name}`));
  const rules = Object.entries(CSS_OFF)
    .filter(([name]) => OFF.has(name) || OFF.has('all'))
    .map(([, rule]) => rule)
    .concat(experiments.map((name) => EXPERIMENTS[name]));
  if (rules.length === 0) return;
  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.append(style);
}
