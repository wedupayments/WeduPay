terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team_id   = var.org_id
}

variable "vercel_api_token" {
  type        = string
  description = "Vercel API Token"
  sensitive   = true
}

variable "github_repo" {
  type        = string
  description = "GitHub repository (owner/name)"
  default     = "wedupayments/WeduPay"
}

variable "production_domain" {
  type        = string
  description = "Production domain (bare)"
  default     = "wedupay.com"
}

variable "project_id" {
  type        = string
  description = "Existing Vercel Project ID"
}

variable "org_id" {
  type        = string
  description = "Vercel Org ID"
}

variable "environment_variables" {
  type = map(string)
  default = {
    DATABASE_URL                  = ""
    DIRECT_URL                    = ""
    NEXT_PUBLIC_SUPABASE_URL      = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY = ""
    SUPABASE_SERVICE_ROLE_KEY      = ""
    SUPABASE_JWT_SECRET           = ""
    NEXT_PUBLIC_APP_URL           = "https://wedupay.com"
    LOG_LEVEL                     = "info"
    ENABLE_AUDIT_LOGS             = "true"
  }
}

resource "vercel_project" "app" {
  name      = "wedu-pay"
  framework = "nextjs"
  
  # Link to GitHub
  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  root_directory = "/"
}

resource "vercel_project_domain" "production" {
  project_id = vercel_project.app.id
  domain     = var.production_domain
}

resource "vercel_project_environment_variable" "env" {
  for_each = var.environment_variables
  
  project_id = vercel_project.app.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview", "development"]
}
