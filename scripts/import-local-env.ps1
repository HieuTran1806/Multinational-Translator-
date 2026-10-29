# Imports approved local runtime settings from the repository-root .env.local without printing values.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot ".env.local"
if (-not (Test-Path $envFile)) { throw "Repo-root .env.local not found: $envFile" }

$allowed = @(
    "DATABASE_URL", "DATABASE_URL_UNPOOLED", "NEON_BRANCH",
    "R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
    "R2_ENDPOINT", "R2_REGION", "APP_STORAGE_PROVIDER", "APP_STORAGE_LOCAL_ROOT",
    "APP_CORS_ALLOWED_ORIGINS"
)
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        if ($allowed -contains $name) {
            if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}
