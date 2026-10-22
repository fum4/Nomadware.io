# Cloudflare Turnstile for the marketing site's contact form (NWARE-82). Its site key and secret
# go straight to the Vercel project (vercel.tf): the secret is minted here and lives only in
# state and in Vercel, never in a file. Rotate: `mise run tf -- apply -replace=cloudflare_turnstile_widget.marketing_contact`.
# Token: CLOUDFLARE_API_TOKEN needs Account · Turnstile · Edit (secrets/README.md).
resource "cloudflare_turnstile_widget" "marketing_contact" {
  account_id = var.account_id
  name       = "nomadware-io-contact-form"
  # Production only. Local dev and `marketing:preview` use Cloudflare's test keys instead.
  domains = [vercel_project_domain.marketing_apex.domain]
  mode    = "managed"
  region  = "world"
}
