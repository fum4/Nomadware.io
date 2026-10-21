resource "cloudflare_zone" "nomadware_io" {
  account = { id = var.account_id }
  name    = "nomadware.io"
  type    = "full"
}

output "name_servers" {
  description = "Set these as the domain's nameservers at the registrar (GoDaddy)"
  value       = cloudflare_zone.nomadware_io.name_servers
}
