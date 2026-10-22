import { SITE } from './site';

// PostHog (EU cloud, org Nomadware, project 316793). The token is public by design: it only
// lets a browser send events. Requests go through our own domain (/ingest, proxied by the Vercel
// rewrites in apps/marketing/vercel.json), so the page never talks to posthog.com directly.
export const ANALYTICS = {
  token: 'phc_n3CSLb3d9M6wCC3GHiPZR2KJa5ikXJ56a58QK9NoHqZ3',
  /** Must match the rewrite prefix in vercel.json. */
  apiHost: '/ingest',
  uiHost: 'https://eu.posthog.com',
  /** Production builds only: dev and `astro dev` never send. */
  enabled: import.meta.env.PROD,
  /**
   * And only on the real site: a production build served anywhere else (`marketing:preview` on
   * localhost or over the tailnet) never loads PostHog, so previews can't pollute the numbers.
   */
  hostname: new URL(SITE.url).hostname,
} as const;

/** Whether this page sends anything: a production build, on the real site. Browser only. */
export const analyticsOn = (): boolean =>
  ANALYTICS.enabled && location.hostname === ANALYTICS.hostname;
