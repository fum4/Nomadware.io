resource "cloudflare_zone" "nomadware_io" {
  account = { id = var.account_id }
  name    = "nomadware.io"
  type    = "full"
}

output "name_servers" {
  description = "The zone's Cloudflare nameservers (the registrar, Cloudflare Registrar, uses them automatically)"
  value       = cloudflare_zone.nomadware_io.name_servers
}
