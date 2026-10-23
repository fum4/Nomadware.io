import type { PostHog, PostHogConfig, PostHogInterface } from 'posthog-js';

import { ANALYTICS, analyticsOn } from '../../config/analytics';
import { whenIdle } from '../motion';
import { clearTrackingStorage } from './clear-tracking-storage';
import type { Consent } from './consent-store';
import { readConsent } from './consent-store';
import { ANALYTICS_LOAD_DELAY_MS, ANALYTICS_LOAD_TRIGGERS, PRIVATE_SELECTOR } from './constants';
import { connectTrack } from './track';

// What everyone gets, choice or not: anonymous page views, clicks, web vitals and errors, with
// nothing stored on the device and no person profiles (we never identify).
const BASE_CONFIG: Partial<PostHogConfig> = {
  api_host: ANALYTICS.apiHost,
  ui_host: ANALYTICS.uiHost,
  defaults: '2026-08-30',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: {
    css_selector_ignorelist: ['.ph-no-autocapture', '[data-ph-no-autocapture]', PRIVATE_SELECTOR],
  },
  capture_performance: { web_vitals: true, network_timing: true },
  capture_exceptions: true,
  session_recording: { maskAllInputs: true, maskTextSelector: PRIVATE_SELECTOR },
  disable_surveys: true,
  disable_product_tours: true,
  disable_conversations: true,
};

/** What a "sure" adds: a cookie to recognise repeat visits, session replay, heatmaps. */
const consentConfig = (consent: Consent | undefined): Partial<PostHogConfig> => {
  const granted = consent === 'granted';
  return {
    persistence: granted ? 'localStorage+cookie' : 'memory',
    disable_session_recording: !granted,
    capture_heatmaps: granted,
  };
};

let client: PostHogInterface | undefined;
let requested = false;

function init(posthog: PostHog): void {
  // Read the choice now, not when loading was scheduled: the visitor may have chosen meanwhile.
  const consent = readConsent();
  if (consent !== 'granted') clearTrackingStorage();
  posthog.init(ANALYTICS.token, {
    ...BASE_CONFIG,
    ...consentConfig(consent),
    loaded: (instance) => {
      client = instance;
      connectTrack((event, props) => instance.capture(event, props));
    },
  });
}

function importWhenIdle(): void {
  whenIdle(() => {
    void import('posthog-js').then(({ default: posthog }) => init(posthog));
  });
}

/**
 * Load posthog-js on the visitor's first interaction, or ANALYTICS_LOAD_DELAY_MS after `load`,
 * whichever comes first — then on idle. Evaluating the SDK is one ~100 ms task; this keeps it out
 * of the page's start-up (and out of Lighthouse's blocking time). Events tracked before then queue.
 */
export function loadAnalytics(): void {
  if (!analyticsOn() || requested) return;
  requested = true;
  let timer = 0;
  let started = false;
  const start = (): void => {
    if (started) return;
    started = true;
    clearTimeout(timer);
    ANALYTICS_LOAD_TRIGGERS.forEach((type) => window.removeEventListener(type, start));
    importWhenIdle();
  };
  ANALYTICS_LOAD_TRIGGERS.forEach((type) =>
    window.addEventListener(type, start, { once: true, passive: true }),
  );
  const arm = (): void => void (timer = window.setTimeout(start, ANALYTICS_LOAD_DELAY_MS));
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm, { once: true });
}

/** Apply a choice made on this page. "no thanks" also forgets this visitor and wipes storage. */
export function applyConsent(consent: Consent): void {
  client?.set_config(consentConfig(consent));
  if (consent === 'denied') {
    client?.reset();
    clearTrackingStorage();
  }
}
