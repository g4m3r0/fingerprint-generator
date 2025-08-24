<#
Deploy script for Docker image
- Builds the image
- Tags with package.json version and latest
- Pushes to fra.vultrcr.com/gsoftwarelab/fingerprint-generator

Usage (PowerShell):
  pwsh -File ./deploy.ps1

Optional env vars for registry login:
  $env:DOCKER_USERNAME = "<user>"
  $env:DOCKER_PASSWORD = "<password>"
#>

[CmdletBinding()]
param(
  [string]$Registry = "fra.vultrcr.com",
  [string]$Namespace = "gsoftwarelab"
)

# Static image name for the repository
$ImageName = "fingerprint-generator"

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Move to repo root (script location)
Set-Location -Path $PSScriptRoot

# Read package.json
$pkgPath = Join-Path $PSScriptRoot 'package.json'
if (!(Test-Path -Path $pkgPath)) {
  Write-Error "package.json not found at $pkgPath"
  exit 1
}

try {
  $pkg = Get-Content -Raw -Path $pkgPath | ConvertFrom-Json
} catch {
  Write-Error "Failed to parse package.json: $($_.Exception.Message)"
  exit 1
}

# Only the version is required now (name is static)
if (-not $pkg.version) {
  Write-Error "package.json must contain 'version'"
  exit 1
}

# Version sanitization for docker tag
$version = $pkg.version.ToString().Trim()
$versionTag = ($version -replace "[^A-Za-z0-9_.-]", "-")

# Compose repo from static image name
$repo = "$Registry/$Namespace/$ImageName"

Write-Host "Building image: $repo with tags: $versionTag, latest" -ForegroundColor Cyan

# Build image with both tags in one build for caching efficiency
& docker build -t "${repo}:${versionTag}" -t "${repo}:latest" .

# Optional registry login if credentials are provided via environment
if ($env:DOCKER_USERNAME -and $env:DOCKER_PASSWORD) {
  Write-Host "Logging in to $Registry as $($env:DOCKER_USERNAME)" -ForegroundColor Yellow
  $env:DOCKER_PASSWORD | docker login $Registry --username $env:DOCKER_USERNAME --password-stdin | Out-Null
}

Write-Host "Pushing ${repo}:${versionTag}" -ForegroundColor Cyan
& docker push "${repo}:${versionTag}"

Write-Host "Pushing ${repo}:latest" -ForegroundColor Cyan
& docker push "${repo}:latest"

Write-Host "Deployment complete." -ForegroundColor Green
