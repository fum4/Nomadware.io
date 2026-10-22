# `apps/marketing` — the nomadware.io site

**What:** the public site at `nomadware.io` (canonical; `www.nomadware.io` 308s to it, `infra/terraform/vercel.tf`). One page, Astro 7, prerendered to static HTML, deployed by Vercel through `@astrojs/vercel`. Client JS is a handful of small vanilla `<script>` modules — no framework runtime. Package `@nomadware/marketing`.

**Depends on:** nothing else in the repo. The Vercel project (`nomadware-io`, team `nware`, framework preset `astro`) builds it with Root Directory `apps/marketing`; those settings are Terraform in `infra/terraform/vercel.tf`.

**Run:** `mise run marketing:dev` (dev server, :4321) · `mise run marketing:build` (`astro check` + `astro build`, what Vercel runs and what `pre-merge` gates) · `mise run marketing:preview` (build, then serve `dist/`). On the devbox, long-running servers go through `devstack run` / `/serve`. The scripts pass `--ignore-lock`: Astro backgrounds its servers when it detects an agent, which would detach them from their supervisor.

**Layout:**

| Path | Holds |
|---|---|
| `src/pages/index.astro` | the page: nav, hero, stats, how we work, contact, footer |
| `src/layouts/base-layout.astro` | `<html>`, fonts (preloaded), SEO head, JSON-LD, skip link, page frame |
| `src/components/` | one `.astro` component per file, styles scoped inside it |
| `src/scripts/` | client behaviour (wordmark, headline scramble, dot field, stats count-up, relative times); `scripts/contact/` = the terminal form |
| `src/styles/` | `tokens.css` (every colour/font/radius), `global.css`, the contact terminal's global CSS (its spans are painted by script) |
| `src/config/` | `site.ts` (name, URL, SEO copy, email) · `build-info.ts` (commit SHA + build time for "last deploy") |
| `src/data/stats-snapshot.ts` | the stats strip's numbers, typed like the future live snapshot JSON |
| `src/format/` | formatting shared by server render and client (stat numbers, "4m ago") |
| `src/constants.ts` | tunables: breakpoints, animation timings, dot field, form |
| `public/` | icons, `og.png` (1200×630), `site.webmanifest`, `robots.txt`, `logo.png` |

**Conventions:**
- Server renders final content; scripts only enhance (no-JS gets every number, the full wordmark, and a plain `mailto:` form). Everything animated respects `prefers-reduced-motion`.
- Colours only through `tokens.css`. `--faint` is the dimmest text colour that still passes 4.5:1 on `--ink`; go dimmer only for non-text.
- Fonts: Geist + Geist Mono, self-hosted from `@fontsource-variable/*` via Astro's font API (`astro.config.ts`), latin subset, `font-display: swap`, Geist preloaded.
- Build env goes through `astro:env` (`astro.config.ts` schema) and is read in `src/config/build-info.ts` only. Off Vercel the SHA reads `dev`.

**Stats data (placeholder until live data lands).** `src/data/stats-snapshot.ts` is hand-computed: actions = `tool_use` events in the devbox's Claude transcripts per window; checks / caught = `pc-*.pre-push|pre-merge.service` units in the user journal that finished ("Consumed") / failed ("Failed with result") — the journal only reaches back to 2026-10-02. Update `generatedAt` with the numbers.

**Contact form.** "send" opens a pre-filled `mailto:contact@nomadware.io` until the form endpoint exists. The real `<input>`/`<textarea>` sit invisibly over a painted copy (custom caret, fresh-character glow); they keep focus, autofill and screen-reader access. The email field is `type="text" inputmode="email"`: `type="email"` has no selection API, which the caret needs.

**Extend:** a page is a file under `src/pages/` (it is prerendered; opt a route into on-demand rendering with `export const prerender = false`). A component is one `.astro` file under `src/components/`; its behaviour is a module under `src/scripts/` imported from the component's `<script>`. Formatting and lint come from the repo root (`pnpm check:format`, `pnpm check:lint`; oxfmt doesn't format `.astro`).
