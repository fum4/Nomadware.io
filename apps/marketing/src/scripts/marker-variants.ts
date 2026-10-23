// TEMPORARY (NWARE-82, marker comparison): `?markers=1|5` picks one of the two caught-marker
// treatments left in stats-chart.astro ([data-markers]; 1, the cut-out, is the default) for the
// owner to compare. Deleted with the losing variant once one is picked.

const VARIANTS = new Set(['1', '5']);

export function applyMarkerVariant(root: HTMLElement): void {
  const variant = new URLSearchParams(location.search).get('markers');
  if (variant && VARIANTS.has(variant)) root.dataset.markers = variant;
}
