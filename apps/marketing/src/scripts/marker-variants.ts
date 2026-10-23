// TEMPORARY (NWARE-82, marker comparison): `?markers=1..5` picks one of the caught-marker
// treatments in stats-chart.astro ([data-markers]) for the owner to compare. Deleted with the
// losing variants once one is picked.

const VARIANTS = new Set(['1', '2', '3', '4', '5']);

export function applyMarkerVariant(root: HTMLElement): void {
  const variant = new URLSearchParams(location.search).get('markers');
  if (variant && VARIANTS.has(variant)) root.dataset.markers = variant;
}
