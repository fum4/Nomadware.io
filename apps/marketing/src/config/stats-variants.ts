import { STATS_VARIANTS } from 'astro:env/server';

// TEMPORARY (NWARE-82): alternative stats cards the owner is choosing between, shown only when
// STATS_VARIANTS is set (a local preview's .env.local; never on Vercel). `?stats=<id>` picks one;
// production always renders the current card. Delete with the losing variants once one is chosen.

export const STATS_VARIANT_IDS = ['current', 'a', 'b', 'c', 'd', 'e'] as const;
export type StatsVariantId = (typeof STATS_VARIANT_IDS)[number];

export const STATS_VARIANT_NAMES: Record<StatsVariantId, string> = {
  current: 'current',
  a: 'headline',
  b: 'board',
  c: 'sentence',
  d: 'heartbeat',
  e: 'receipt',
};

export const statsVariantsOn = STATS_VARIANTS;

const isVariant = (value: string | null): value is StatsVariantId =>
  STATS_VARIANT_IDS.some((id) => id === value);

export function pickStatsVariant(url: URL): StatsVariantId {
  const asked = url.searchParams.get('stats');
  return statsVariantsOn && isVariant(asked) ? asked : 'current';
}
