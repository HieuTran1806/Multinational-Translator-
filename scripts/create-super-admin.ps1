param(
    [ValidateSet("schema-rebuild-test", "production")]
    [string]$Branch = "production",
    [ValidatePattern("^[a-zA-Z0-9_.-]{3,64}$")]
    [string]$Username = "superadmin01"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-"
$BackendDir = Join-Path $ProjectRoot "services\backend"
$TempDir = Join-Path $env:TEMP "mt-super-admin-helper"
$ClassPathFile = Join-Path $env:TEMP "mt-super-admin-classpath.txt"

if ($Branch -eq "production") {
    $confirm = Read-Host "Ban dang ghi vao PRODUCTION. Nhap PRODUCTION de xac nhan"
    if ($confirm -cne "PRODUCTION") {
        throw "Da huy. Khong thay doi database."
    }
}

if (-not (Get-Command neon -ErrorAction SilentlyContinue)) {
    throw "Khong tim thay Neon CLI. Hay cai dat/dang nhap Neon CLI truoc."
}
if (-not (Get-Command javac -ErrorAction SilentlyContinue) -or
    -not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Khong tim thay JDK (can ca javac va java)."
}
if (-not (Test-Path (Join-Path $BackendDir "mvnw.cmd"))) {
    throw "Khong tim thay Maven wrapper: $BackendDir"
}

# Get the branch connection URI without printing credentials.
$dbUri = (& neon connection-string $Branch --ssl require 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $dbUri.StartsWith("postgres")) {
    throw "Khong lay duoc connection string cho branch '$Branch'. Kiem tra Neon CLI va quyen truy cap."
}

$securePassword = Read-Host "Nhap mat khau cho tai khoan Super Admin (toi thieu 12 ky tu)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($plainPassword) -or $plainPassword.Length -lt 12) {
    $plainPassword = $null
    throw "Mat khau Super Admin phai co it nhat 12 ky tu."
}

New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
Push-Location $BackendDir
try {
    & .\mvnw.cmd -q dependency:build-classpath "-Dmdep.outputFile=$ClassPathFile"
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $ClassPathFile)) {
        throw "Khong tao duoc Maven classpath."
    }
} finally {
    Pop-Location
}

$javaSource = @'
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.Properties;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class SuperAdminCreate {
    static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws Exception {
        String rawUri = System.getenv("MT_DB_URI");
        String username = System.getenv("MT_SUPER_ADMIN_USERNAME");
        String password = System.getenv("MT_SUPER_ADMIN_PASSWORD");
        if (rawUri == null || username == null || password == null || password.isBlank()) {
            throw new IllegalStateException("Missing required environment variables.");
        }
        if (!username.matches("^[a-zA-Z0-9_.-]{3,64}$") || password.length() < 12) {
            throw new IllegalArgumentException("Username or password does not meet requirements.");
        }

        URI uri = new URI(rawUri);
        String scheme = uri.getScheme();
        if (!"postgresql".equalsIgnoreCase(scheme) && !"postgres".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Unexpected database URI scheme.");
        }
        String[] credentials = uri.getRawUserInfo().split(":", 2);
        if (credentials.length != 2) {
            throw new IllegalArgumentException("Database URI has no valid credentials.");
        }
        String user = decode(credentials[0]);
        String dbPassword = decode(credentials[1]);
        String authority = uri.getRawAuthority();
        String jdbcUrl = "jdbc:postgresql://" + authority.substring(authority.indexOf('@') + 1)
            + (uri.getRawPath() == null ? "" : uri.getRawPath())
            + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());

        Properties props = new Properties();
        props.setProperty("user", user);
        props.setProperty("password", dbPassword);
        props.setProperty("connectTimeout", "10");
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String insertSql = """
            INSERT INTO account
              (username, password_hash, display_name, role, enabled,
               created_at, updated_at, deleted_at, deleted_by)
            VALUES (?, ?, 'Super Admin', 'SUPER_ADMIN', TRUE,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
            ON CONFLICT (username) WHERE deleted_at IS NULL DO NOTHING
            """;

        try (Connection conn = DriverManager.getConnection(jdbcUrl, props)) {
            conn.setAutoCommit(false);
            try {
                int inserted;
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    ps.setString(1, username);
                    ps.setString(2, encoder.encode(password));
                    inserted = ps.executeUpdate();
                }
                if (inserted != 1) {
                    throw new SQLException("An active account with this username already exists; refusing to overwrite it.");
                }

                try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT password_hash, role, enabled, deleted_at FROM account WHERE username = ? AND deleted_at IS NULL")) {
                    ps.setString(1, username);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()
                            || !"SUPER_ADMIN".equals(rs.getString("role"))
                            || !rs.getBoolean("enabled")
                            || rs.getString("deleted_at") != null
                            || !encoder.matches(password, rs.getString("password_hash"))) {
                            throw new SQLException("Super Admin account verification failed.");
                        }
                    }
                }
                conn.commit();
                System.out.println("SUCCESS: Super Admin account created and verified.");
                System.out.println("Neon branch selected: " + args[0]);
                System.out.println("Username: " + username);
                System.out.println("Role: SUPER_ADMIN; enabled: true; password stored as BCrypt.");
            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } finally {
            dbPassword = null;
            password = null;
        }
    }
}
'@

$javaFile = Join-Path $TempDir "SuperAdminCreate.java"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($javaFile, $javaSource, $utf8NoBom)
$classPath = (Get-Content $ClassPathFile -Raw).Trim()
$oldDbUri = $env:MT_DB_URI
$oldUsername = $env:MT_SUPER_ADMIN_USERNAME
$oldPassword = $env:MT_SUPER_ADMIN_PASSWORD

try {
    $env:MT_DB_URI = $dbUri
    $env:MT_SUPER_ADMIN_USERNAME = $Username
    $env:MT_SUPER_ADMIN_PASSWORD = $plainPassword

    # Never print the connection URI or password.
    $null = & javac -cp $classPath -d $TempDir $javaFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Compile helper that bai. Kiem tra Maven dependencies cua backend."
    }
    & java -cp "$TempDir;$classPath" SuperAdminCreate $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Tao/xac minh Super Admin that bai. Transaction se rollback neu co loi."
    }
} finally {
    $env:MT_DB_URI = $oldDbUri
    $env:MT_SUPER_ADMIN_USERNAME = $oldUsername
    $env:MT_SUPER_ADMIN_PASSWORD = $oldPassword
    $plainPassword = $null
    $dbUri = $null
    $securePassword = $null
    Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $ClassPathFile -Force -ErrorAction SilentlyContinue
}
