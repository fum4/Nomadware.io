import { STATS_CARD_VARIANT } from '../constants';

// TEMPORARY (NWARE-82): `?card=N` marks the stats card with one of the phone layouts under
// comparison (styles/stats-card-variants.css). No param: today's layout.
const { param, values } = STATS_CARD_VARIANT;
const picked = new URLSearchParams(location.search).get(param);
const variant = values.find((value) => value === picked);
const root = document.querySelector<HTMLElement>('[data-stats]');
if (variant && root) root.dataset.cardVariant = variant;
