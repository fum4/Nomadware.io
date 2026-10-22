# `apps/marketing` — the nomadware.io site

**What:** the public site at `nomadware.io` (canonical; `www.nomadware.io` 308s to it, `infra/terraform/vercel.tf`). One page, Astro 7, prerendered to static HTML, plus one on-demand route (`POST /api/contact`, a Vercel function), deployed by Vercel through `@astrojs/vercel`. Client JS is a handful of small vanilla `<script>` modules — no framework runtime. Package `@nomadware/marketing`.

**Depends on:** nothing else in the repo. The Vercel project (`nomadware-io`, team `nware`, framework preset `astro`) builds it with Root Directory `apps/marketing`; those settings, and the env it runs with, are Terraform in `infra/terraform/vercel.tf`; local env comes from `infra/env/marketing.dev.env`.

**Run:** `mise run marketing:dev` (dev server, :4321) · `mise run marketing:build` (`astro check` + `astro build`, what Vercel runs) · `mise run marketing:test` (vitest, hermetic) · `mise run marketing:preview` (build, then serve `dist/`). `pre-merge` gates test + build. Each first renders `apps/marketing/.env` (`mise run secrets:render`, from `infra/env/marketing.dev.env`): the build needs `TURNSTILE_SITE_KEY`. On the devbox, long-running servers go through `devstack run` / `/serve`. The scripts pass `--ignore-lock`: Astro backgrounds its servers when it detects an agent, which would detach them from their supervisor.

**Layout:**

| Path | Holds |
|---|---|
| `src/pages/index.astro` | the page: nav, hero, stats, how we work, contact, footer |
| `src/layouts/base-layout.astro` | `<html>`, fonts (preloaded), SEO head, JSON-LD, skip link, page frame |
| `src/components/` | one `.astro` component per file, styles scoped inside it |
| `src/scripts/` | client behaviour (wordmark, headline scramble, hero tags flicker, dot field, stats count-up, relative times, `grid-band.ts` = snaps a `PageSection band` onto the grid lines); `intro-sequence.ts` = the load choreography (scramble → stats → wordmark, each started by the previous one finishing; the tags flicker inside the first gap); `scripts/contact/` = the terminal form (+ lazy Turnstile, the POST); `scripts/analytics/` = PostHog, consent banner, `track()` ([its README](src/scripts/analytics/README.md)) |
| `src/pages/api/contact.ts` | the contact endpoint: size check, config, rate limiter, logging; the logic is `src/contact/` |
| `src/contact/` | the contact form's rules and server logic: `validation.ts` (shared with the browser), `contact-api.ts` (wire contract), `handle-contact.ts` (parse → rate limit → honeypot → validate → Turnstile → Resend), one module per step, `*.test.ts` beside each |
| `src/log/` | `log-event.ts`, the server's one log sink (JSON lines; never names, addresses, IPs or messages) |
| `src/styles/` | `tokens.css` (every colour/font/radius), `global.css`, the contact terminal's global CSS (its spans are painted by script) |
| `src/config/` | `site.ts` (name, URL, SEO copy, email) · `build-info.ts` (commit SHA + build time for "last deploy") · `contact.ts` (the contact form's env) · `analytics.ts` (PostHog token + hosts, public) |
| `src/data/stats-snapshot.ts` | the stats strip's numbers, typed like the future live snapshot JSON |
| `src/format/` | formatting shared by server render and client (stat numbers, "4m ago") |
| `src/constants.ts` | tunables: breakpoints, animation timings, dot field, form, contact endpoint |
| `vercel.json` | edge routing Astro can't express: the `/ingest/*` PostHog proxy rewrites, `/sitemap.xml` → `/sitemap-index.xml` (308) |
| `public/` | icons, `og.png` (1200×630), `site.webmanifest`, `robots.txt`, `logo.png` |

**Conventions:**
- Server renders final content; scripts only enhance (no-JS gets every number, the full wordmark, and the contact address in place of the form). Everything animated respects `prefers-reduced-motion`.
- Colours only through `tokens.css`. `--faint` is the dimmest text colour that still passes 4.5:1 on `--ink`; go dimmer only for non-text.
- Fonts: Geist + Geist Mono, self-hosted from `@fontsource-variable/*` via Astro's font API (`astro.config.ts`), latin subset, `font-display: swap`, Geist preloaded.
- Env goes through `astro:env` (`astro.config.ts` schema) and is read only in `src/config/` (`build-info.ts`, `contact.ts`). Off Vercel the SHA reads `dev`. Vercel's values are Terraform (`infra/terraform/vercel.tf`); local ones are rendered (above), your overrides go in `apps/marketing/.env.local`.

**Stats data (placeholder until live data lands).** `src/data/stats-snapshot.ts` is hand-computed: actions = `tool_use` events in the devbox's Claude transcripts per window; checks / caught = `pc-*.pre-push|pre-merge.service` units in the user journal that finished ("Consumed") / failed ("Failed with result") — the journal only reaches back to 2026-10-02. Update `generatedAt` with the numbers.

**Contact form** (NWARE-82). "send" posts JSON to `POST /api/contact`, which emails `contact@nomadware.io` through Resend (from `contact-form@send.nomadware.io`, reply-to the visitor). Spam: a honeypot field (`website`; filled → a fake 200, nothing sent), Cloudflare Turnstile (managed, `interaction-only`; the script loads on the form's first focus, never with the page; the token is verified server-side incl. hostname), and a per-IP limit of 5/hour **per warm function instance** — best effort, reset by cold starts; a shared counter (Vercel WAF rate-limit rule) is the upgrade if spam gets past Turnstile. Every failure reads the same to the visitor; the reason code (`contact-api.ts`) goes to the log. Env: `TURNSTILE_SITE_KEY` (public, build-time, required), `TURNSTILE_SECRET` + `TURNSTILE_HOSTNAME` + `RESEND_API_KEY` (runtime; any missing → `503 unconfigured`, logged by name). Locally the Turnstile values are Cloudflare's test keys (siteverify reports `example.com`) and there is no Resend key, so a local send ends `unconfigured`; to test delivery, put a key in `.env.local`. Vercel previews get only the test site key: they can't send. The real `<input>`/`<textarea>` sit invisibly over a painted copy (custom caret, fresh-character glow); they keep focus, autofill and screen-reader access. The email field is `type="text" inputmode="email"`: `type="email"` has no selection API, which the caret needs.

**Analytics.** PostHog (EU), proxied through `/ingest` so the page only talks to its own origin; loaded after load + idle, production builds only. Anonymous and storage-free until the visitor says "sure" in the consent banner (footer "privacy" reopens it). Custom events go through `track()` from `src/scripts/analytics/track.ts`; their names are a dashboard contract (`events.ts`). Mechanism and the consent model: [src/scripts/analytics/README.md](src/scripts/analytics/README.md).

**Extend:** a page is a file under `src/pages/` (it is prerendered; opt a route into on-demand rendering with `export const prerender = false`). A component is one `.astro` file under `src/components/`; its behaviour is a module under `src/scripts/` imported from the component's `<script>`. Formatting and lint come from the repo root (`pnpm check:format`, `pnpm check:lint`; oxfmt doesn't format `.astro`).
