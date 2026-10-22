# Nomadware.io — repo rules

Cross-repo rules: the owner's global agent rules (devbox `agents/AGENTS.md`); this file adds only what's specific here.

## What this is
The nomadware.io hub (Linear project *Nomadware.io*, team NWARE), a pnpm workspace: one `apps/<name>/` per `*.nomadware.io` service (today `apps/marketing`, Qwik on Vercel) plus the domain as code in `infra/terraform/` (zone, records, Vercel project). Map: [README.md](README.md).

## Invariants
- **Every DNS record lives in `infra/terraform/records.tf`; the Vercel project's settings live in `infra/terraform/vercel.tf`.** No dashboard edits (drift); `mise run tf -- plan` must show no changes.
- **Never break mail or the site:** iCloud MX/SPF/DKIM/DMARC and the Vercel records stay DNS-only (proxy off).
- Secrets only via `secrets/*.age` + `repo-secrets` (devbox `docs/repo-secrets.md`); ids like the Cloudflare account id are config (`terraform.auto.tfvars`).
- Ledger (backlog, decisions, owner to-dos) lives in **Linear** (`LINEAR_TEAM=NWARE`), not in files.

## Merging
The agent has full merge ownership here (owner, 2026-10-21): PR → `wt pre-merge` green → `wt merge` → for DNS/Vercel, `mise run tf -- apply` from `master` right after.

## Routing
| Occasion | Doc | Guardrail |
|---|---|---|
| Change DNS / add a subdomain | [infra/terraform/README.md](infra/terraform/README.md) | plan before apply; plan clean after |
| Add an app | [README.md](README.md) § Adding an app | `@nomadware/<name>`, `<name>:*` mise tasks, build in `pre-merge` |
| Work on the marketing site | [apps/marketing/README.md](apps/marketing/README.md) | `mise run marketing:build` green before push |
| Add a secret | devbox `docs/repo-secrets.md` | `mise run secrets:edit secrets/<x>.age`; never plaintext |
