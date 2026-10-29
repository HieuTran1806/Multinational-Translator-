
param(
    [ValidateSet("schema-rebuild-test", "production")]
    [string]$Branch = "production"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-"
$BackendDir = Join-Path $ProjectRoot "services\backend"
$TempDir = Join-Path $env:TEMP "mt-admin01-helper"
$ClassPathFile = Join-Path $env:TEMP "mt-admin01-classpath.txt"

if ($Branch -eq "production") {
    $confirm = Read-Host "Ban dang ghi vao PRODUCTION. Nhap PRODUCTION de xac nhan"
    if ($confirm -cne "PRODUCTION") {
        throw "Da huy. Khong thay doi database."
    }
}

if (-not (Get-Command neon -ErrorAction SilentlyContinue)) {
    throw "Khong tim thay Neon CLI. Hay cai dat/dang nhap Neon CLI truoc."
}

if (-not (Test-Path (Join-Path $BackendDir "mvnw.cmd"))) {
    throw "Khong tim thay Maven wrapper: $BackendDir"
}

# Lay connection string tu Neon CLI; khong in gia tri ra man hinh.
$dbUri = (& neon connection-string $Branch --ssl require 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $dbUri.StartsWith("postgres")) {
    throw "Khong lay duoc connection string cho branch '$Branch'. Kiem tra Neon CLI va quyen truy cap."
}

# Yeu cau nhap mat khau khi chay, khong luu mat khau trong file script.
$securePassword = Read-Host "Nhap mat khau cho admin01 (vi du: admin1234567)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($plainPassword)) {
    throw "Mat khau khong duoc de trong."
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

public class AdminAccountUpsert {
    static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws Exception {
        String rawUri = System.getenv("MT_DB_URI");
        String password = System.getenv("MT_ADMIN_PASSWORD");
        if (rawUri == null || password == null || password.isBlank()) {
            throw new IllegalStateException("Missing required environment variables.");
        }

        URI uri = new URI(rawUri);
        String scheme = uri.getScheme();
        if (!"postgresql".equalsIgnoreCase(scheme) &&
            !"postgres".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Unexpected database URI scheme.");
        }

        String[] credentials = uri.getRawUserInfo().split(":", 2);
        if (credentials.length != 2) {
            throw new IllegalArgumentException("Database URI has no valid credentials.");
        }

        String user = decode(credentials[0]);
        String dbPassword = decode(credentials[1]);
        String path = uri.getRawPath();
        String query = uri.getRawQuery();

        String jdbcUrl = "jdbc:postgresql://" + uri.getRawAuthority()
            .substring(uri.getRawAuthority().indexOf('@') + 1)
            + (path == null ? "" : path)
            + (query == null ? "" : "?" + query);

        Properties props = new Properties();
        props.setProperty("user", user);
        props.setProperty("password", dbPassword);
        props.setProperty("connectTimeout", "10");

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(password);

        String sql = """
            INSERT INTO account
              (username, password_hash, display_name, role, enabled,
               created_at, updated_at, deleted_at, deleted_by)
            VALUES (?, ?, ?, 'ADMIN', TRUE,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
            ON CONFLICT (username) WHERE deleted_at IS NULL
            DO UPDATE SET
              password_hash = EXCLUDED.password_hash,
              display_name = EXCLUDED.display_name,
              role = 'ADMIN',
              enabled = TRUE,
              updated_at = CURRENT_TIMESTAMP,
              deleted_at = NULL,
              deleted_by = NULL
            """;

        try (Connection conn = DriverManager.getConnection(jdbcUrl, props)) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, "admin01");
                    ps.setString(2, hash);
                    ps.setString(3, "Administrator");
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT password_hash, role, enabled, deleted_at " +
                    "FROM account WHERE username = ? AND deleted_at IS NULL")) {
                    ps.setString(1, "admin01");
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()
                            || !"ADMIN".equals(rs.getString("role"))
                            || !rs.getBoolean("enabled")
                            || rs.getString("deleted_at") != null
                            || !encoder.matches(password, rs.getString("password_hash"))) {
                            throw new SQLException("Account verification failed.");
                        }
                    }
                }
                conn.commit();
                System.out.println("SUCCESS: admin01 created/updated and verified.");
                System.out.println("Branch selected in Neon CLI: " + args[0]);
                System.out.println("Role: ADMIN; enabled: true; password stored as BCrypt.");
            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } finally {
            // Clear local references as soon as practical.
            dbPassword = null;
            password = null;
        }
    }
}
'@

$javaFile = Join-Path $TempDir "AdminAccountUpsert.java"
# Ghi Java source dưới dạng UTF-8 khong BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    $javaFile,
    $javaSource,
    $utf8NoBom
)

$classPath = (Get-Content $ClassPathFile -Raw).Trim()
$oldDbUri = $env:MT_DB_URI
$oldAdminPassword = $env:MT_ADMIN_PASSWORD

try {
    $env:MT_DB_URI = $dbUri
    $env:MT_ADMIN_PASSWORD = $plainPassword

    # Khong hien thi connection string hay password.
    $null = & javac -cp $classPath -d $TempDir $javaFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Compile helper that bai. Kiem tra Maven dependencies cua backend."
    }

    & java -cp "$TempDir;$classPath" AdminAccountUpsert $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Tao/xac minh tai khoan that bai. Database transaction da duoc rollback neu co loi SQL."
    }
} finally {
    $env:MT_DB_URI = $oldDbUri
    $env:MT_ADMIN_PASSWORD = $oldAdminPassword
    $plainPassword = $null
    $dbUri = $null
    $securePassword = $null
    Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $ClassPathFile -Force -ErrorAction SilentlyContinue
}