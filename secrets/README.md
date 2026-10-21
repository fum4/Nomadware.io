# `secrets/` — Nomadware.io's encrypted secrets

age-encrypted and committed next to the code; decrypted with the Nomadware.io age key
(`~/.config/age/Nomadware.io.key`). Pattern and commands: devbox `docs/repo-secrets.md`.

| File | Holds | Read by |
|---|---|---|
| `recipients.txt` | the owners' age public keys | `repo-secrets` (encrypt target) |
| `terraform.env.age` | `CLOUDFLARE_API_TOKEN` (account token `nomadware-io-dns`: Zone·Write + DNS·Write, all domains) · `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (S3 keys derived from account token `nomadware-io-terraform-state`: R2 Bucket Item Write on `nomadware-io-backup`) | `mise run tf` via `repo-secrets exec` |
