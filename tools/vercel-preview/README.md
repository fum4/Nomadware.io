# `tools/vercel-preview` — an app's production build, served locally as Vercel would

**What:** `mise run marketing:preview` (and any future Vercel app's `preview`). Runs Vercel's own build, `vercel build --prod`, in the app directory — the framework build plus Vercel's merge of `vercel.json` into `.vercel/output/config.json`, the same step a deploy runs — then serves `.vercel/output` on `:4321`: `static/` files, every `functions/<name>.func` imported in-process, and the routes of `config.json` (headers, redirects, rewrites to a function, external rewrites proxied). Package `@nomadware/vercel-preview`.

**Depends on:** the Vercel CLI, pinned in the root `.mise.toml` (`npm:vercel`); Node runs `src/main.ts` directly (type stripping) — no build, no runtime dependencies. No Vercel login or token: `vercel build` normally pulls the project's settings (`vercel pull`), but with a `.vercel/project.json` present it reads them from there, so `main.ts` writes one (stub ids, `--framework` from the app's `preview` script; it must match the project's `framework` in `infra/terraform/vercel.tf`). A real `vercel link` there is left alone.

**Run:** from the app's `package.json`: `node ../../tools/vercel-preview/src/main.ts --framework <slug>`. `PORT` / `HOST` override `:4321` / `localhost`. The functions' runtime env is the app's `.env.local` then `.env` (a variable already set wins), standing in for the Vercel project's env. On the devbox it is a long-running server: start it through `devstack run` / `/serve`.

**Faithful, and where it isn't:**

| Same as Vercel | Differs |
|---|---|
| build command, adapter output, `vercel.json` merge (it is Vercel's code) | one Node process: no cold starts, a function's module state lives as long as the server (the contact rate limiter never resets) |
| route order and phases (`handle: filesystem`, `error`), `$1` captures, case-insensitive `src` (Vercel's default without `caseSensitive`) | only the route keys our output uses (`src dest headers status continue check`); anything else fails at start-up, extend `src/routes.ts` |
| functions get the original URL, `x-forwarded-for` | Node.js `fetch`-export functions only (what `@astrojs/vercel` emits); no Edge runtime, no ISR / prerender functions, no image optimisation |

**Extend:** a route feature is a key in `ROUTE_KEYS` and its handling in `resolve` (`src/routes.ts`), with a case in `src/routes.test.ts` (`node --test`, hermetic). A new launcher shape is `loadFunction` in `src/output.ts`.
