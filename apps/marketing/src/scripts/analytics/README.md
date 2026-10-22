# `scripts/analytics` — PostHog, consent, `track()`

**What:** product analytics for the site (PostHog EU cloud, org Nomadware, project 316793) and the consent banner that decides how much of it runs.

**Depends on:** `posthog-js` (imported dynamically on the first interaction or 3 s after `load`, then on idle: evaluating it is one ~100 ms task that must stay out of start-up and Lighthouse's blocking time), `config/analytics.ts` (token, hosts, `enabled` = production builds only), the `/ingest/*` rewrites in `apps/marketing/vercel.json`, `components/consent-banner.astro` (markup + styles, mounted by the base layout) and the footer's `data-consent-open` button.

**Consent model** (owner-approved, NWARE-82):

| State | What runs |
|---|---|
| no choice yet / "no thanks" | `persistence: 'memory'` (nothing on the device), page views + page leave, click autocapture, web vitals, exceptions. No replay, no heatmaps, never `identify`. |
| "sure" | `localStorage+cookie` persistence, session replay (all inputs masked), heatmaps — switched on in place with `set_config`. |

The choice lives in `localStorage['nw-consent']` (`granted` / `denied`). "no thanks" after a "sure" switches back to memory, `reset()`s the visitor and deletes every `ph_*` / `__ph*` cookie and storage key. Anything showing what the visitor typed carries `data-private` (masked in replay, ignored by autocapture) — the contact terminal's painted copy does.

**Public API:**
- `track(event, props?)` from `track.ts` — typed by `events.ts`; safe before PostHog loads (queues, flushes on connect); no-op in dev. Never put PII or form contents in a property.
- `loadAnalytics()` / `applyConsent()` (`posthog-client.ts`) and `initConsentBanner()` — used by the banner component only.

**Events** (`events.ts`; the names are a contract — PostHog dashboards and the `contact_form_succeeded` conversion goal use them):

| Event | Fired from |
|---|---|
| `stats_viewed` {window} | `stats-strip.ts`, once the strip is ≥50% in view |
| `stats_window_toggled` {window} | `stats-strip.ts`, 7d/30d click |
| `contact_nav_clicked` | `site-nav.astro` |
| `contact_form_focused` | `contact-form.ts`, first focus / click / key in the form (the desktop auto-focus doesn't count) |
| `contact_form_started` | `contact-form.ts`, first character typed |
| `contact_form_submitted` / `_succeeded` / `_failed` {reason} | `contact-form.ts` `send()` — see below |

**Hooking the form backend:** `send()` fires `contact_form_failed {reason: 'incomplete'}` when validation stops it, then `contact_form_submitted` when a valid draft leaves. With the `mailto:` hand-off, `contact_form_succeeded` fires right after it; once the form posts to an endpoint, move `succeeded` to the 2xx response and fire `failed` with a short machine reason (`'network'`, `'rate_limited'`, `'server'`, …) on every other outcome.

**Extend:** a new event = a key in `AnalyticsEvents` (props or `null`) + a `track()` call; tell whoever owns the dashboards. A new consent-gated feature = a field in `consentConfig` in `posthog-client.ts`, and a line in the banner's "what we track".
