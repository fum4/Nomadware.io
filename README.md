# Nomadware.io

The hub for everything under `nomadware.io`: each app that serves a `*.nomadware.io` hostname, and the domain itself as code.

| Path | What | Deploys to |
|---|---|---|
| [`apps/marketing/`](apps/marketing/README.md) | the marketing site (`nomadware.io`, `www`), Astro | Vercel |
| [`packages/site-stats/`](packages/site-stats/README.md) | the live-stats contract: snapshot shape, validator, its R2 object | — (a workspace package) |
| [`tools/stats-publisher/`](tools/stats-publisher/README.md) | computes the site's live stats on the devbox, uploads them to R2 every 5 min | the devbox (`mise run stats:publish`) |
| [`infra/terraform/`](infra/terraform/README.md) | the `nomadware.io` zone, every DNS record, the Vercel project, the R2 stats bucket | Cloudflare, Vercel (`mise run tf -- apply`) |
| [`secrets/`](secrets/README.md) | Terraform credentials (+ the Resend key Terraform hands Vercel), age-encrypted | — |
| `infra/env/` | committed per-app dev config (`marketing.dev.env`), rendered into `apps/<app>/.env` by `mise run secrets:render` | — |

Lives elsewhere, DNS only here: `ops.nomadware.io` (Coolify control plane, [fum4/ops](https://github.com/fum4/ops)), `stremio.nomadware.io` ([fum4/stremio-plus-plus](https://github.com/fum4/stremio-plus-plus)).

## Working on it

```bash
mise install && mise run setup   # toolchain (node, pnpm, terraform) + workspace install
mise run marketing:dev           # marketing site dev server
mise run tf -- plan              # DNS / Vercel changes (needs the repo's age key)
```

`mise tasks` lists everything. Gates: `pre-push` (oxfmt, oxlint, workspace typecheck, terraform fmt + validate) and `pre-merge` (every workspace package's tests, every app's build). Shared code is a `packages/<name>/` workspace package, operator tooling a `tools/<name>/` one; both ship TypeScript that Node runs directly (`tsconfig.node.json`).

## Adding an app

`apps/<name>/` with its own `package.json` (`@nomadware/<name>`) and `README.md`, `mise` tasks `<name>:dev|build` (+ `<name>:test` once it has tests), its build and tests added to `pre-merge`, and its hostname as one entry in `infra/terraform/records.tf`.
