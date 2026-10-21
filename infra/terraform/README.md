# `infra/terraform/` — nomadware.io DNS (Cloudflare)

The `nomadware.io` zone and every record in it. Registration stays at GoDaddy; DNS is served by Cloudflare.

| File | Holds |
|---|---|
| `zone.tf` | the zone (+ `name_servers` output: what the registrar must point to) |
| `records.tf` | all records, one map entry each (site, `ops`, iCloud Mail, verifications) |
| `backend.tf` | state in R2 bucket `nomadware-io-backup` (created by hand: bootstrap exception) |
| `versions.tf` | Terraform + provider pins (bump deliberately to the latest release) |

**Run** (credentials stay in memory): `mise run tf -- plan` / `mise run tf -- apply`. First time on a machine: `mise install`, the repo's age key at `~/.config/age/Nomadware.io.key`, then `mise run tf -- init`.

**Add a subdomain:** one entry in `local.records` in `records.tf` → `plan` → `apply`. Proxy stays off unless the service is meant to sit behind Cloudflare.
