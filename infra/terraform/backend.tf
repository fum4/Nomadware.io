# State in Cloudflare R2 (S3 API), EU jurisdiction (hence the `.eu.` endpoint) like every `<repo>-backup`.
# The `nomadware-io-backup` bucket was created by hand on purpose
# (bootstrap exception: Terraform can't create the bucket that holds its own state).
# Credentials: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from secrets/terraform.env.age via `mise run tf`.
terraform {
  backend "s3" {
    bucket = "nomadware-io-backup"
    key    = "terraform/nomadware-io.tfstate"
    region = "auto"
    endpoints = {
      s3 = "https://fbc5bc4bfe835ba7165482b7c8f500ee.eu.r2.cloudflarestorage.com"
    }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    use_path_style              = true
    use_lockfile                = true
  }
}
