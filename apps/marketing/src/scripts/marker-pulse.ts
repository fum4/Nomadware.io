import { MARKER_PULSE } from '../constants';

// The caught markers' pulse (stats-chart.astro: data-pulse runs one ring-pulse), one after
// another: each starts at least `spacingMs` after the one before, so a dense stretch ripples
// instead of flashing at once. A long queue tightens the spacing so it drains within
// `maxRippleMs`. data-pulse lives only while its pulse runs: a CSS animation starts over when its
// plot is shown again (display: none → block), so a lingering one would pulse a second time.

const PULSE_ATTRIBUTE = 'data-pulse';

/**
 * The chart's one queue of pulses: markers join it in order; cancel drops whatever waits and ends
 * whatever runs.
 */
export interface PulseQueue {
  add: (markers: readonly HTMLElement[]) => void;
  cancel: () => void;
}

/**
 * Restart one marker's pulse, mid-pulse too: a reflow between off and on starts it over. Its end
 * takes the attribute off (a restarted pulse is cancelled, not ended: only the new one's end
 * counts).
 */
function pulse(marker: HTMLElement): void {
  marker.removeAttribute(PULSE_ATTRIBUTE);
  void marker.offsetWidth;
  marker.setAttribute(PULSE_ATTRIBUTE, '');
  marker.addEventListener('animationend', () => marker.removeAttribute(PULSE_ATTRIBUTE), {
    once: true,
  });
}

export function createPulseQueue(): PulseQueue {
  const { spacingMs, maxRippleMs } = MARKER_PULSE;
  let waiting: HTMLElement[] = [];
  /** Pulsed and maybe still running: a cancel stops them too (their plot is being hidden). */
  const started = new Set<HTMLElement>();
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
    started.add(marker);
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
      started.forEach((marker) => marker.removeAttribute(PULSE_ATTRIBUTE));
      started.clear();
    },
  };
}
