import { analyticsOn } from '../../config/analytics';
import { TRACK_QUEUE_LIMIT } from './constants';
import type { AnalyticsEvent, AnalyticsEvents } from './events';

type EventProps = Record<string, string>;
type Capture = (event: AnalyticsEvent, props: EventProps | undefined) => void;
type PropsArg<E extends AnalyticsEvent> = AnalyticsEvents[E] extends null
  ? []
  : [props: AnalyticsEvents[E]];

const queue: [AnalyticsEvent, EventProps | undefined][] = [];
let capture: Capture | undefined;

/**
 * Send a custom event. Safe to call before posthog-js has loaded (it is loaded lazily, after the
 * page is idle): events queue and flush once it connects. No-op unless analytics is on (a
 * production build on nomadware.io).
 */
export function track<E extends AnalyticsEvent>(event: E, ...[props]: PropsArg<E>): void {
  if (!analyticsOn()) return;
  const properties: EventProps | undefined = props ? { ...props } : undefined;
  if (capture) {
    capture(event, properties);
    return;
  }
  if (queue.length >= TRACK_QUEUE_LIMIT) queue.shift();
  queue.push([event, properties]);
}

/** Called once by the PostHog client when it has loaded: flushes the queue, then goes direct. */
export function connectTrack(send: Capture): void {
  capture = send;
  for (const [event, props] of queue.splice(0)) send(event, props);
}
