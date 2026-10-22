# Nomadware.io

The hub for everything under `nomadware.io`: each app that serves a `*.nomadware.io` hostname, and the domain itself as code.

| Path | What | Deploys to |
|---|---|---|
| [`apps/marketing/`](apps/marketing/README.md) | the marketing site (`nomadware.io`, `www`), Astro | Vercel |
| [`infra/terraform/`](infra/terraform/README.md) | the `nomadware.io` zone, every DNS record, the Vercel project | Cloudflare, Vercel (`mise run tf -- apply`) |
| [`secrets/`](secrets/README.md) | Terraform credentials, age-encrypted | — |

Lives elsewhere, DNS only here: `ops.nomadware.io` (Coolify control plane, [fum4/ops](https://github.com/fum4/ops)), `stremio.nomadware.io` ([fum4/stremio-plus-plus](https://github.com/fum4/stremio-plus-plus)).

## Working on it

```bash
mise install && mise run setup   # toolchain (node, pnpm, terraform) + workspace install
mise run marketing:dev           # marketing site dev server
mise run tf -- plan              # DNS / Vercel changes (needs the repo's age key)
```

`mise tasks` lists everything. Gates: `pre-push` (oxfmt, oxlint, terraform fmt + validate) and `pre-merge` (every app's build).

## Adding an app

`apps/<name>/` with its own `package.json` (`@nomadware/<name>`) and `README.md`, `mise` tasks `<name>:dev|build`, its build added to `pre-merge`, and its hostname as one entry in `infra/terraform/records.tf`.
