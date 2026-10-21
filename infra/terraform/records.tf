# Every record of nomadware.io. Carried over from GoDaddy on 2026-10-21 (NWARE-78); GoDaddy's own
# `_domainconnect` helper is intentionally not carried. Proxy off everywhere: Vercel and Coolify
# terminate TLS themselves, and mail records can't be proxied.
locals {
  zone = "nomadware.io"
  records = {
    # Marketing site (Vercel)
    apex_a = { name = local.zone, type = "A", content = "216.198.79.1" }
    www    = { name = "www.${local.zone}", type = "CNAME", content = "7b3b229f3ffa4fb4.vercel-dns-017.com" }

    # Coolify control plane (fum4/ops)
    ops = { name = "ops.${local.zone}", type = "A", content = "77.42.125.36" }

    # Stremio host's "Romanian (AI)" addon (fum4/stremio-companion). A LAN address on purpose: only
    # the home network reaches it; the certificate comes from Let's Encrypt via DNS-01 (token
    # `stremio-companion-acme`). A new host IP means editing this one line.
    stremio = { name = "stremio.${local.zone}", type = "A", content = "192.168.1.132" }

    # iCloud Mail
    mx1   = { name = local.zone, type = "MX", content = "mx01.mail.icloud.com", priority = 10 }
    mx2   = { name = local.zone, type = "MX", content = "mx02.mail.icloud.com", priority = 10 }
    spf   = { name = local.zone, type = "TXT", content = "\"v=spf1 include:icloud.com ~all\"" }
    dkim  = { name = "sig1._domainkey.${local.zone}", type = "CNAME", content = "sig1.dkim.nomadware.io.at.icloudmailadmin.com" }
    dmarc = { name = "_dmarc.${local.zone}", type = "TXT", content = "\"v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;\"" }

    # Domain verifications
    apple_verification  = { name = local.zone, type = "TXT", content = "\"apple-domain=8DvGyY7ccwCYYPd8\"" }
    google_verification = { name = local.zone, type = "TXT", content = "\"google-site-verification=pFOHYHBe8aRjWy6vCLoryygoelWtzJup8mcgPavtEkA\"" }
  }
}

resource "cloudflare_dns_record" "this" {
  for_each = local.records

  zone_id  = cloudflare_zone.nomadware_io.id
  name     = each.value.name
  type     = each.value.type
  content  = each.value.content
  priority = lookup(each.value, "priority", null)
  ttl      = 1 # automatic
  proxied  = false
}
