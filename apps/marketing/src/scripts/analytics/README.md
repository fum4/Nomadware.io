# `scripts/analytics` — PostHog, consent, `track()`

**What:** product analytics for the site (PostHog EU cloud, org Nomadware, project 316793) and the consent banner that decides how much of it runs.

**Depends on:** `posthog-js` (imported dynamically on the first interaction or 3 s after `load`, then on idle: evaluating it is one ~100 ms task that must stay out of start-up and Lighthouse's blocking time), `config/analytics.ts` (token, hosts, `enabled` = production builds only, `hostname` = and only when served from `nomadware.io`, so a local or tailnet `marketing:preview` never sends), the `/ingest/*` rewrites in `apps/marketing/vercel.json`, `components/consent-banner.astro` (markup + styles, mounted by the base layout) and the footer's `data-consent-open` button.

**Consent model** (owner-approved, NWARE-82):

| State | What runs |
|---|---|
| no choice yet / "no thanks" | `persistence: 'memory'` (nothing on the device), page views + page leave, click autocapture, web vitals, exceptions. No replay, no heatmaps, never `identify`. |
| "sure" | `localStorage+cookie` persistence, session replay (all inputs masked), heatmaps — switched on in place with `set_config`. |

The choice lives in `localStorage['nw-consent']` (`granted` / `denied`). "no thanks" after a "sure" switches back to memory, `reset()`s the visitor and deletes every `ph_*` / `__ph*` cookie and storage key. Anything showing what the visitor typed carries `data-private` (masked in replay, ignored by autocapture); third-party widgets get `ph-no-capture` (blocked).

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
| `contact_form_submitted` / `_succeeded` / `_failed` {reason} | `contact-form.ts` `send()` — see Form outcomes |

**Form outcomes:** `send()` fires `contact_form_failed {reason: 'validation'}` when client validation stops it; `contact_form_submitted` once a Turnstile token is in hand and the POST starts; then `contact_form_succeeded` on a 2xx, or `contact_form_failed {reason}` otherwise. Reasons (`ContactFailReason` in `events.ts`): `validation`, `turnstile` (no token: script blocked, challenge failed or timed out), `network` (fetch rejected), `server` (non-2xx without a known code), or the endpoint's own `ContactCode` (`rate_limited`, `invalid`, `challenge_failed`, `send_failed`, `unconfigured`, … from `src/contact/contact-api.ts`). Never form contents.

**Replay privacy in the form:** the painted typed-text copy and the status line (it repeats the visitor's email) are `data-private`; the Turnstile mount is `ph-no-capture` (blocked entirely). Inputs are masked by `maskAllInputs`.

**Extend:** a new event = a key in `AnalyticsEvents` (props or `null`) + a `track()` call; tell whoever owns the dashboards. A new consent-gated feature = a field in `consentConfig` in `posthog-client.ts`, and a line in the banner's "what we track".
