# Token: CLOUDFLARE_API_TOKEN from secrets/terraform.env.age (account token `nomadware-io-dns`).
provider "cloudflare" {}

# Token: VERCEL_API_TOKEN from secrets/terraform.env.age (token `nomadware-io-terraform`, scope: team nware).
# Team set per resource (team_id), not here: a team-scoped token can't read the team object the
# provider-level `team` argument fetches at startup (team_unauthorized).
provider "vercel" {}
