# Pinned to the latest releases at time of writing (2026-10-21); bump deliberately.
terraform {
  required_version = "1.16.6"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.28.1"
    }
  }
}
