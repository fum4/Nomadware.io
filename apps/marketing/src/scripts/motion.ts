import { FINE_POINTER_QUERY, MOBILE_QUERY, REDUCED_MOTION_QUERY } from '../constants';

// Environment questions every client script asks, answered in one place.

export const prefersReducedMotion = (): boolean => matchMedia(REDUCED_MOTION_QUERY).matches;

export const isMobileViewport = (): boolean => matchMedia(MOBILE_QUERY).matches;

/** A mouse-first device: the only place we auto-focus inputs or chase the cursor. */
export const hasFinePointer = (): boolean => matchMedia(FINE_POINTER_QUERY).matches;

/** Run work after first paint, when the main thread is idle (setTimeout where unsupported). */
export function whenIdle(task: () => void): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task);
  } else {
    setTimeout(task, 1);
  }
}

/** Call `onVisible` once when `target` crosses `threshold` of visibility. */
export function onceVisible(target: Element, threshold: number, onVisible: () => void): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        onVisible();
      }
    },
    { threshold },
  );
  observer.observe(target);
}
