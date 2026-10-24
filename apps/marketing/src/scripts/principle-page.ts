/**
 * The principle a pinned switcher shows at scroll `position` (in pages: 0 → `pages`), given the one
 * it shows now: it moves off `current` only once the scroll is `hysteresis` (share of a page) past
 * the boundary, so resting on a boundary never flickers between two (scripts/principle-switcher.ts).
 */
export function nextPage(
  position: number,
  current: number,
  pages: number,
  hysteresis: number,
): number {
  const raw = Math.min(pages - 1, Math.max(0, Math.floor(position)));
  if (raw > current && position >= raw + hysteresis) return raw;
  if (raw < current && position <= raw + 1 - hysteresis) return raw;
  return current;
}
