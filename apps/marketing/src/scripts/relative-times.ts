import { RELATIVE_TIME_REFRESH_MS } from '../constants';
import { relativeTime } from '../format/relative-time';

/** Keep every `<time data-relative>` reading "Xm ago" against the visitor's clock. */
export function initRelativeTimes(): void {
  const times = [...document.querySelectorAll<HTMLTimeElement>('time[data-relative]')];
  if (times.length === 0) return;
  const refresh = (): void => {
    const now = Date.now();
    times.forEach((time) => (time.textContent = relativeTime(time.dateTime, now)));
  };
  refresh();
  setInterval(refresh, RELATIVE_TIME_REFRESH_MS);
}
