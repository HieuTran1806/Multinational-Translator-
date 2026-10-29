# Runs the backend locally against the Neon production database (profile: local-neon).
# Reads DATABASE_URL from the repo-root .env.local and converts the postgresql:// URI
# to a JDBC URL (pgJDBC cannot parse the libpq URI scheme).
# Never prints credentials; secrets stay in environment variables.
$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repo ".env.local"
if (-not (Test-Path $envFile)) { throw "Repo-root .env.local not found: $envFile" }

. (Join-Path $PSScriptRoot "import-local-env.ps1")
$uriText = $env:DATABASE_URL
if (-not $uriText) { throw "DATABASE_URL is not set in $envFile" }
try { $parsedUri = [System.Uri]::new($uriText) } catch { throw "DATABASE_URL is not a valid PostgreSQL URI" }
if ($parsedUri.Scheme -ne 'postgresql' -or -not $parsedUri.Host -or -not $parsedUri.AbsolutePath.Trim('/')) {
    throw "DATABASE_URL must use postgresql://user:password@host/database format"
}
$userInfo = [System.Uri]::UnescapeDataString($parsedUri.UserInfo)
$separator = $userInfo.IndexOf(':')
if ($separator -lt 1) { throw "DATABASE_URL must include username and password" }
$user = $userInfo.Substring(0, $separator)
$pass = $userInfo.Substring($separator + 1)
$dbHost = $parsedUri.Authority
$db = [System.Uri]::UnescapeDataString($parsedUri.AbsolutePath.TrimStart('/'))
# Use Uri.Query (including the leading '?') so JDBC never mistakes query options for the database name.
$queryParts = @($parsedUri.Query.TrimStart('?') -split '&' | Where-Object { $_ -and $_ -notmatch '^channel_binding=' })
if (-not ($queryParts | Where-Object { $_ -match '^sslmode=' })) { $queryParts += 'sslmode=require' }
$params = $queryParts -join '&'

$env:DB_URL = "jdbc:postgresql://$dbHost/$db`?$params"
$env:DB_USERNAME = $user
$env:DB_PASSWORD = $pass
if (-not $env:PORT) { $env:PORT = "18081" }
Write-Host "DB target: $dbHost/$db (sslmode enforced). Starting backend with profile local-neon on port $env:PORT..."
& (Join-Path $repo "services\backend\mvnw.cmd") -f (Join-Path $repo "services\backend\pom.xml") spring-boot:run "-Dspring-boot.run.profiles=local-neon"
