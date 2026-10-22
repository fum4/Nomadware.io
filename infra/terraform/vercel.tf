# The Vercel project that builds and serves apps/marketing (nomadware.io, www).
# Imported 2026-10-22 with every setting pinned to what the dashboard had, so the import changed nothing.
import {
  to = vercel_project.marketing
  id = "${var.vercel_team_id}/prj_UXE0adk5RZs6C8RxtWMEsn0dfof1"
}

resource "vercel_project" "marketing" {
  team_id        = var.vercel_team_id
  name           = "nomadware-io"
  framework      = "astro"
  node_version   = "24.x"
  root_directory = "apps/marketing"

  # Unpinned, this would detach the repo and stop every deploy.
  git_repository = {
    type              = "github"
    repo              = "fum4/Nomadware.io"
    production_branch = "master"
  }

  # false (Vercel flips it on an Instant Rollback) pins the domains to one old deployment: every
  # later production build goes live only on *.vercel.app.
  auto_assign_custom_domains = true
  build_machine_type         = "basic"
  resource_config = {
    fluid                    = false
    function_default_regions = ["fra1"]
  }
}

# Without Corepack, Vercel picks pnpm from the lockfile version (v9.0 → pnpm 9/10) and ignores
# package.json `packageManager`; with it, builds use the same pnpm as mise pins.
resource "vercel_project_environment_variable" "marketing_corepack" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "ENABLE_EXPERIMENTAL_COREPACK"
  value      = "1"
  target     = ["production", "preview"]
  sensitive  = false
}

# Production domains. The apex is canonical (site.ts, sitemap, robots, OG all use it): it serves,
# www redirects to it. Imported 2026-10-22; the dashboard had it the other way round.
import {
  to = vercel_project_domain.marketing_apex
  id = "${var.vercel_team_id}/prj_UXE0adk5RZs6C8RxtWMEsn0dfof1/nomadware.io"
}

resource "vercel_project_domain" "marketing_apex" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  domain     = "nomadware.io"
}

import {
  to = vercel_project_domain.marketing_www
  id = "${var.vercel_team_id}/prj_UXE0adk5RZs6C8RxtWMEsn0dfof1/www.nomadware.io"
}

resource "vercel_project_domain" "marketing_www" {
  team_id              = var.vercel_team_id
  project_id           = vercel_project.marketing.id
  domain               = "www.nomadware.io"
  redirect             = vercel_project_domain.marketing_apex.domain
  redirect_status_code = 308
}

# ── Contact form (NWARE-82): POST /api/contact, apps/marketing/src/config/contact.ts ──
# Production gets the real Turnstile widget (turnstile.tf) and the Resend key. Previews get only
# Cloudflare's always-pass test site key, so they build; their endpoint answers `unconfigured`
# (no secret, no Resend key), so a preview can never send mail.
resource "vercel_project_environment_variable" "marketing_turnstile_site_key" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "TURNSTILE_SITE_KEY"
  value      = cloudflare_turnstile_widget.marketing_contact.sitekey
  target     = ["production"]
  sensitive  = false
}

resource "vercel_project_environment_variable" "marketing_turnstile_site_key_preview" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "TURNSTILE_SITE_KEY"
  value      = "1x00000000000000000000AA" # Cloudflare's documented always-pass test site key
  target     = ["preview"]
  sensitive  = false
}

resource "vercel_project_environment_variable" "marketing_turnstile_hostname" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "TURNSTILE_HOSTNAME"
  value      = vercel_project_domain.marketing_apex.domain
  target     = ["production"]
  sensitive  = false
}

resource "vercel_project_environment_variable" "marketing_turnstile_secret" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "TURNSTILE_SECRET"
  value      = cloudflare_turnstile_widget.marketing_contact.secret
  target     = ["production"]
  sensitive  = true
}

# Created once TF_VAR_resend_api_key is in secrets/terraform.env.age; until then the endpoint
# answers `unconfigured`. (nonsensitive: whether a key exists is not the secret.)
resource "vercel_project_environment_variable" "marketing_resend_api_key" {
  count = nonsensitive(var.resend_api_key != null) ? 1 : 0

  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "RESEND_API_KEY"
  value      = var.resend_api_key
  target     = ["production"]
  sensitive  = true
}

# ── Live stats (NWARE-82): apps/marketing/src/config/stats-source.ts ──
# The R2 read credential, created once the TF_VAR_site_stats_reader_* pair is in
# secrets/terraform.env.age; until then the page shows the bundled snapshot. Env reaches a
# deployment when it is built, so a change here needs a redeploy.
resource "vercel_project_environment_variable" "marketing_stats_access_key_id" {
  count = nonsensitive(var.site_stats_reader_access_key_id != null) ? 1 : 0

  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "STATS_R2_ACCESS_KEY_ID"
  value      = var.site_stats_reader_access_key_id
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "marketing_stats_secret_access_key" {
  count = nonsensitive(var.site_stats_reader_access_key_id != null) ? 1 : 0

  team_id    = var.vercel_team_id
  project_id = vercel_project.marketing.id
  key        = "STATS_R2_SECRET_ACCESS_KEY"
  value      = var.site_stats_reader_secret_access_key
  target     = ["production", "preview"]
  sensitive  = true
}
