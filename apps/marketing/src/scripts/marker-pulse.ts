// The caught markers' pulse (stats-chart.astro: data-pulse runs one ring-pulse): restarted on
// demand, mid-pulse too.

/** Pulse every one of `markers` from the start, together. */
export function pulseMarkers(markers: readonly HTMLElement[]): void {
  if (markers.length === 0) return;
  markers.forEach((marker) => marker.removeAttribute('data-pulse'));
  // One reflow between off and on, so a pulse still running starts over instead of carrying on.
  void markers[0]?.offsetWidth;
  markers.forEach((marker) => marker.setAttribute('data-pulse', ''));
}
