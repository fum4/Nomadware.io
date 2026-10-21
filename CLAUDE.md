# Nomadware.io — repo rules

Cross-repo rules: the owner's global agent rules (devbox `agents/AGENTS.md`); this file adds only what's specific here.

## What this is
The nomadware.io monorepo in the making (Linear project *Nomadware.io*, team NWARE): today the marketing site (Qwik, Vercel) at the root plus the domain's DNS as code. NWARE-78 restructures it (`apps/site/`, one home per `*.nomadware.io` subdomain).

## Invariants
- **Every DNS record lives in `infra/terraform/records.tf`.** No dashboard edits (drift); `mise run tf -- plan` must show no changes.
- **Never break mail or the site:** iCloud MX/SPF/DKIM/DMARC and the Vercel records stay DNS-only (proxy off).
- Secrets only via `secrets/*.age` + `repo-secrets` (devbox `docs/repo-secrets.md`); ids like the Cloudflare account id are config (`terraform.auto.tfvars`).
- Ledger (backlog, decisions, owner to-dos) lives in **Linear** (`LINEAR_TEAM=NWARE`), not in files.

## Routing
| Occasion | Doc | Guardrail |
|---|---|---|
| Change DNS / add a subdomain | [infra/terraform/README.md](infra/terraform/README.md) | plan before apply; plan clean after |
| Add a secret | devbox `docs/repo-secrets.md` | `mise run secrets:edit secrets/<x>.age`; never plaintext |
