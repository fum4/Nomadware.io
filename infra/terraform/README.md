# `infra/terraform/` — nomadware.io as code (Cloudflare DNS, Vercel)

The `nomadware.io` zone and every record in it. Both registration (Cloudflare Registrar, transferred from GoDaddy 2026-10-22) and DNS live in Cloudflare.

| File | Holds |
|---|---|
| `zone.tf` | the zone (+ `name_servers` output) |
| `records.tf` | all records, one map entry each (site, `ops`, iCloud Mail, verifications) |
| `vercel.tf` | the Vercel project `nomadware-io` (team `nware`) that builds the marketing site, its env vars, and its domains (apex serves; `www` 308s to the apex) |
| `backend.tf` | state in R2 bucket `nomadware-io-backup` (created by hand: bootstrap exception) |
| `versions.tf` | Terraform + provider pins (bump deliberately to the latest release) |

**Vercel:** every project setting the dashboard used to own lives in `vercel.tf`; change it here, never in the dashboard. Token `nomadware-io-terraform` (`VERCEL_API_TOKEN`), scoped to team `nware`; the team id is config (`vercel_team_id`).

**Run** (credentials stay in memory): `mise run tf -- plan` / `mise run tf -- apply`. First time on a machine: `mise install`, the repo's age key at `~/.config/age/Nomadware.io.key`, then `mise run tf -- init`.

**Add a subdomain:** one entry in `local.records` in `records.tf` → `plan` → `apply`. Proxy stays off unless the service is meant to sit behind Cloudflare.

**Registration (not in Terraform).** The Cloudflare provider has no registrar resource, so the registration's settings are dashboard-only (dash.cloudflare.com → Domain Registration → Manage Domains → `nomadware.io`). Expected state — check it after any registrar change:

| Setting | Expected |
|---|---|
| Auto-renew | on (renews yearly at cost; expiry 2027-10-30 after the transfer) |
| Transfer lock | on — Cloudflare locks by default and shows no toggle; verify via RDAP status `client transfer prohibited` |
| WHOIS redaction | on |
