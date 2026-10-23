import { MARKER_PULSE } from '../constants';

// The caught markers' pulse (stats-chart.astro: data-pulse runs one ring-pulse), one after
// another: each starts at least `spacingMs` after the one before, so a dense stretch ripples
// instead of flashing at once. A long queue tightens the spacing so it drains within
// `maxRippleMs`.

/** The chart's one queue of pulses: markers join it in order; cancel drops whatever waits. */
export interface PulseQueue {
  add: (markers: readonly HTMLElement[]) => void;
  cancel: () => void;
}

/** Restart one marker's pulse, mid-pulse too: a reflow between off and on starts it over. */
function pulse(marker: HTMLElement): void {
  marker.removeAttribute('data-pulse');
  void marker.offsetWidth;
  marker.setAttribute('data-pulse', '');
}

export function createPulseQueue(): PulseQueue {
  const { spacingMs, maxRippleMs } = MARKER_PULSE;
  let waiting: HTMLElement[] = [];
  let lastStartMs = Number.NEGATIVE_INFINITY;
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Set as markers join, from how many wait then: the queue drains in maxRippleMs at most.
  let spacing: number = spacingMs;

  const schedule = (): void => {
    if (timer !== null || waiting.length === 0) return;
    const delay = Math.max(0, lastStartMs + spacing - performance.now());
    timer = setTimeout(next, delay);
  };
  const next = (): void => {
    timer = null;
    const marker = waiting.shift();
    if (!marker) return;
    pulse(marker);
    lastStartMs = performance.now();
    schedule();
  };

  return {
    add: (markers) => {
      waiting.push(...markers);
      spacing = Math.min(spacingMs, maxRippleMs / waiting.length);
      schedule();
    },
    cancel: () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      waiting = [];
    },
  };
}
