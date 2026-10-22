import type { StatWindow } from '../../data/stats-snapshot';

/**
 * Every custom event the site sends, with its properties (`null` = none). The names are a
 * contract: PostHog dashboards and the marketing conversion goal (`contact_form_succeeded`) are
 * built on them. Never put PII or form contents in a property.
 */
export interface AnalyticsEvents {
  stats_viewed: { window: StatWindow };
  stats_window_toggled: { window: StatWindow };
  contact_nav_clicked: null;
  contact_form_focused: null;
  contact_form_started: null;
  contact_form_submitted: null;
  contact_form_succeeded: null;
  contact_form_failed: { reason: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;
