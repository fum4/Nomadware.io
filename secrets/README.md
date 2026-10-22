# `secrets/` — Nomadware.io's encrypted secrets

age-encrypted and committed next to the code; decrypted with the Nomadware.io age key
(`~/.config/age/Nomadware.io.key`). Pattern and commands: devbox `docs/repo-secrets.md`.

| File | Holds | Read by |
|---|---|---|
| `recipients.txt` | the owners' age public keys | `repo-secrets` (encrypt target) |
| `terraform.env.age` | `CLOUDFLARE_API_TOKEN` (account token `nomadware-io-dns`: Zone·Write + DNS·Write, all domains; plus Account · Turnstile · Edit for the contact form's widget — being added, NWARE-82) · `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (S3 keys derived from account token `nomadware-io-terraform-state`: R2 Bucket Item Write on `nomadware-io-backup`) · `TF_VAR_resend_api_key` (being added, NWARE-82; Resend key `nomadware-marketing-contact`: Sending access, domain `send.nomadware.io`; Terraform hands it to Vercel as `RESEND_API_KEY`) | `mise run tf` via `repo-secrets exec` |
| `manifest` | also renders `apps/marketing/.env` (local dev) from `infra/env/marketing.dev.env`: committed config only, Cloudflare's Turnstile test keys | `mise run marketing:*` |
