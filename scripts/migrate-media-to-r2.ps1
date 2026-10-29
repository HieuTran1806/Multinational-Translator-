[CmdletBinding()]
param(
    [switch]$Execute
)

# Default is a read-only preflight. -Execute uploads and verifies objects but never deletes source files or DB rows.
$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot "import-local-env.ps1")

$required = @("R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
$missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, "Process") })
if ($missing.Count -gt 0) {
    throw ("Missing R2 configuration keys in .env.local: " + ($missing -join ", ") + ". Values are not printed.")
}

$uriText = $env:DATABASE_URL
if (-not $uriText) { throw "DATABASE_URL is not set in .env.local" }
try { $parsedUri = [System.Uri]::new($uriText) } catch { throw "DATABASE_URL is not a valid PostgreSQL URI" }
if ($parsedUri.Scheme -ne 'postgresql' -or -not $parsedUri.Host -or -not $parsedUri.AbsolutePath.Trim('/')) {
    throw "DATABASE_URL must use postgresql://user:password@host/database format"
}
$userInfo = [System.Uri]::UnescapeDataString($parsedUri.UserInfo)
$separator = $userInfo.IndexOf(':')
if ($separator -lt 1) { throw "DATABASE_URL must include username and password" }
$env:DB_USERNAME = $userInfo.Substring(0, $separator)
$env:DB_PASSWORD = $userInfo.Substring($separator + 1)
$dbHost = $parsedUri.Authority
$db = [System.Uri]::UnescapeDataString($parsedUri.AbsolutePath.TrimStart('/'))
$queryParts = @($parsedUri.Query.TrimStart('?') -split '&' | Where-Object { $_ -and $_ -notmatch '^channel_binding=' })
if (-not ($queryParts | Where-Object { $_ -match '^sslmode=' })) { $queryParts += 'sslmode=require' }
$params = $queryParts -join '&'
$env:DB_URL = "jdbc:postgresql://{0}/{1}?{2}" -f $dbHost, $db, $params

# The checked-in default root is relative to services/backend; use that concrete path for migration.
if (-not $env:APP_STORAGE_LOCAL_ROOT) {
    $env:APP_STORAGE_LOCAL_ROOT = Join-Path $repo "services\backend\data\media"
}
$env:APP_STORAGE_PROVIDER = "r2"
$env:SPRING_FLYWAY_ENABLED = "false"
$env:SPRING_MAIN_WEB_APPLICATION_TYPE = "servlet"
$env:SERVER_ADDRESS = "127.0.0.1"
$env:SERVER_PORT = "0"
$env:SPRING_AUTOCONFIGURE_EXCLUDE = "org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration"
$env:APP_STORAGE_MIGRATION_ENABLED = "true"
$env:APP_STORAGE_MIGRATION_EXECUTE = if ($Execute) { "true" } else { "false" }

if ($Execute) {
    Write-Host "R2 media migration: EXECUTE mode. All referenced local media will be preflighted before upload."
} else {
    Write-Host "R2 media migration: DRY RUN. No uploads, database writes, or source-file changes will occur."
}
Write-Host "Database host/database: $dbHost/$db (credentials hidden)."
Push-Location (Join-Path $repo "services\backend")
try {
    & .\mvnw.cmd --batch-mode --no-transfer-progress spring-boot:run "-Dspring-boot.run.profiles=local-neon"
    if ($LASTEXITCODE -ne 0) { throw "Media migration process failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}
