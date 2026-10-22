# The site's live stats (NWARE-82): the devbox publisher (tools/stats-publisher) writes one object,
# v1/stats.json, every 5 minutes; the marketing site reads it on demand. Private: both sides use
# R2 Account API tokens scoped to this bucket: `nomadware-io-site-stats-write` (Object Read & Write, the box
# publisher: secrets/site-stats-publisher.env.age) and `nomadware-io-site-stats-read` (Object Read, the site's Vercel env).
# EU jurisdiction like nomadware-io-backup. Name, endpoint and key: packages/site-stats STATS_OBJECT.
# Not prevent_destroy: the publisher rebuilds the object within 5 minutes.
resource "cloudflare_r2_bucket" "site_stats" {
  account_id   = var.account_id
  name         = "nomadware-io-site-stats"
  jurisdiction = "eu"
}
