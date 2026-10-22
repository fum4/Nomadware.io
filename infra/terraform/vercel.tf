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
