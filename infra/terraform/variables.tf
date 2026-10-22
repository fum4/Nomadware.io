variable "account_id" {
  description = "Cloudflare account that owns the nomadware.io zone"
  type        = string
}

variable "vercel_team_id" {
  description = "Vercel team (nware) that owns the nomadware-io project"
  type        = string
}

variable "resend_api_key" {
  description = "Resend API key `nomadware-marketing-contact` (sending access, send.nomadware.io only); TF_VAR_resend_api_key in secrets/terraform.env.age. Unset: the Vercel env var isn't created."
  type        = string
  sensitive   = true
  default     = null
}

# R2 read-only S3 keys for the live stats (token `nomadware-io-site-stats-read`: Object Read on
# nomadware-io-site-stats only). Secret pair: TF_VAR_* lines in secrets/terraform.env.age.
variable "site_stats_reader_access_key_id" {
  description = "R2 access key id of the site's read-only stats token. Unset: the Vercel env vars aren't created."
  type        = string
  sensitive   = true
  default     = null
}

variable "site_stats_reader_secret_access_key" {
  description = "R2 secret access key of the site's read-only stats token"
  type        = string
  sensitive   = true
  default     = null
}
