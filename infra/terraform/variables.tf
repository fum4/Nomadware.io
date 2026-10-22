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
