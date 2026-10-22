# `apps/marketing` — the nomadware.io site

**What:** the public site at `nomadware.io` / `www.nomadware.io`. Qwik 0.19 + Qwik City, styles with vanilla-extract, SSR on Vercel's edge runtime (`adaptors/vercel-edge/`). Package `@nomadware/marketing`.

**Depends on:** nothing else in the repo. The Vercel project (`nomadware-io`, team `nware`) builds it with Root Directory `apps/marketing`; that setting is Terraform in `infra/terraform/`.

**Run:** `mise run marketing:dev` (dev server) · `mise run marketing:build` (what Vercel runs; also typechecks and lints) · `mise run marketing:preview`.

**Layout:** `src/routes/` (file-based routing: `layout.tsx`, `index.tsx`) · `src/components/<name>/` (`index.tsx` + `styles.css.ts`) · `src/theme/` · `public/` (static assets, served as-is).

**Extend:** a page is a folder under `src/routes/`; a component is a folder under `src/components/` with its styles next to it. Formatting and lint come from the repo root (`pnpm check:format`, `pnpm check:lint`).
