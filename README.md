# Multitional Translator

Nền tảng thuyết minh đa ngôn ngữ cho các điểm tham quan (POI). Repository hiện có backend REST API bằng Spring Boot, giao diện quản trị web và giao diện người dùng (khám phá bản đồ, chi tiết POI, thuyết minh audio) bằng React/Vite, tài liệu hợp đồng và cấu hình Docker phục vụ phát triển cục bộ.

> **Trạng thái hiện tại:** Admin web, web User (UC03–UC05) và backend được triển khai trên nhánh này. Ứng dụng mobile chưa có trong nhánh này. Seller/QR, thanh toán và một số màn hình/luồng nâng cao không được xem là đã triển khai chỉ vì có trong tài liệu thiết kế. CI kiểm tra mã nguồn; **CD/production deployment chưa được kích hoạt**.

## Thành phần chính

| Đường dẫn | Vai trò |
|---|---|
| `apps/admin/` | React 19 + Vite: đăng nhập, quản lý POI, bản dịch, hình ảnh/audio và các thao tác TTS được hỗ trợ bởi backend |
| `apps/web/` | React 19 + Vite: web User UC03–UC05 — bản đồ POI (Leaflet), tìm kiếm địa điểm, chi tiết POI theo ngôn ngữ và trình phát thuyết minh audio |
| `services/backend/` | Java 21, Spring Boot, Maven Wrapper, REST API, Spring Security, JPA, Flyway |
| `infra/` | Docker Compose cho PostgreSQL và backend |
| `design-system/tokens.json` | Design tokens dùng chung |
| `docs/requirements/` | Yêu cầu nghiệp vụ và Use Case |
| `docs/architecture/` | Kiến trúc, cấu trúc và hợp đồng API |
| `docs/development/` | Quy ước phát triển và kiểm thử |
| `docs/operations/` | Hướng dẫn vận hành, CI/CD và kế hoạch triển khai |
| `.github/workflows/ci.yml` | Tự động kiểm tra tài liệu, unit test backend và chất lượng Admin/Web |

Tài liệu nên đọc:
- [Use Case](docs/requirements/Use_Case_Specification_Final_15_UC.md)
- [Kiến trúc](docs/architecture/architecture.md)
- [API contract](docs/architecture/api.md)
- [Kiến trúc backend](services/backend/ARCHITECTURE.md)
- [Báo cáo kiểm chứng Admin](docs/reports/admin-module-verification.md)
- [CI/CD](docs/operations/ci-cd.md)
- [Chuẩn bị triển khai — chưa phải deployment đang hoạt động](docs/operations/deployment.md)

## Yêu cầu môi trường

- Git
- Docker Desktop có Docker Compose v2
- Node.js **22.11 trở lên** (khuyến nghị Node 22 LTS) và npm
- Java **21** nếu chạy backend trực tiếp ngoài Docker
- Kết nối Internet lần đầu để tải image/dependencies

Kiểm tra phiên bản:

```powershell
git --version
node --version
npm --version
docker --version
docker compose version
java -version
```

## Chạy toàn bộ backend + PostgreSQL và Admin trên Windows

Các lệnh dưới đây chạy trong **PowerShell tại thư mục gốc repository**.

### 1. Cấu hình môi trường cục bộ

```powershell
if (-not (Test-Path infra/.env)) { Copy-Item infra/.env.example infra/.env }
notepad infra/.env
```

Đổi `POSTGRES_PASSWORD` thành mật khẩu riêng cho máy local. Không commit `infra/.env`. Nếu cần tạo tài khoản Admin đầu tiên cho môi trường phát triển, cấu hình `APP_BOOTSTRAP_ADMIN_ENABLED=true`, `APP_BOOTSTRAP_ADMIN_USERNAME` và `APP_BOOTSTRAP_ADMIN_PASSWORD` trong tệp này trước khi khởi động. Chỉ dùng mật khẩu local, không dùng lại mật khẩu thật.

### 2. Khởi động PostgreSQL và backend

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml config
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
docker compose --env-file infra/.env -f infra/docker-compose.yml ps
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f backend
```

Đợi backend khởi động xong rồi mở endpoint kiểm tra sức khỏe:

- Backend: http://localhost:8080
- Health: http://localhost:8080/actuator/health
- Readiness: http://localhost:8080/actuator/health/readiness
- OpenAPI UI (dev): http://localhost:8080/swagger-ui.html

Profile `dev` chạy Flyway migration và nạp dữ liệu demo. Sau khi tài khoản Admin đầu tiên đã được tạo, hãy tắt lại `APP_BOOTSTRAP_ADMIN_ENABLED=false` rồi khởi động lại backend. Không bật bootstrap admin trên production một cách thường trực.

### 3. Khởi động Admin web

Mở **một cửa sổ PowerShell khác** ở thư mục gốc:

```powershell
Set-Location apps/admin
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev
```

Mở URL Vite được in ra trong terminal, thông thường là http://localhost:5173. `apps/admin/.env` mặc định trỏ API tới `http://localhost:8080`.

Nếu backend chạy ở địa chỉ khác, sửa `VITE_API_BASE_URL` trong `apps/admin/.env` rồi khởi động lại Vite. Biến có tiền tố `VITE_` được đóng gói vào frontend và **không được chứa bí mật**.

### Chạy riêng giao diện bằng mock API

Để xem UI mà không cần backend hoặc PostgreSQL, đặt `VITE_USE_MOCK=true` trong `apps/admin/.env`, sau đó chạy `npm run dev`. Chế độ này dùng dữ liệu giả lập, không kiểm chứng API thật; đặt lại `false` khi kiểm thử tích hợp.

### 4. Khởi động web User (UC03–UC05)

Mở **một cửa sổ PowerShell khác** ở thư mục gốc:

```powershell
Set-Location apps/web
npm ci
npm run dev
```

Mở http://localhost:5174. Dev server tự proxy `/api` sang `http://localhost:8080` nên không cần cấu hình CORS khi chạy local theo hướng dẫn ở trên.

Xem không cần backend: `$env:VITE_USE_MOCK = "true"; npm run dev` (dữ liệu demo gồm cả audio dựng sẵn). Chi tiết trong [apps/web/README.md](apps/web/README.md).

## Chạy backend trực tiếp (không chạy backend trong Compose)

Nếu chỉ muốn dùng Docker cho PostgreSQL, khởi động riêng database:

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d postgres
```

Trong PowerShell, đặt biến môi trường cho tiến trình backend:

```powershell
$env:SPRING_PROFILES_ACTIVE = "dev"
$env:DB_URL = "jdbc:postgresql://localhost:5432/thuyetminh"
$env:DB_USERNAME = "thuyetminh"
$env:DB_PASSWORD = "<mật-khẩu-POSTGRES_PASSWORD-trong-infra/.env>"
Set-Location services/backend
.\mvnw.cmd spring-boot:run
```

Thay giá trị mật khẩu bằng mật khẩu local đã cấu hình; không đưa mật khẩu vào source code. Không chạy đồng thời backend local và backend Compose trên cùng cổng 8080.

## Lệnh kiểm tra

### Admin

```powershell
Set-Location apps/admin
npm ci
npm run lint
npm test
npm run build
```

Tùy chọn: `npm run verify:e2e` chạy kiểm tra end-to-end qua backend và database **đang hoạt động**. Cần cấu hình `E2E_BASE_URL`, `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD`; xem phần đầu của `apps/admin/scripts/verify-e2e.mjs`. Không chạy E2E trên môi trường production.

### Web User

```powershell
Set-Location apps/web
npm ci
npm run lint
npm test
npm run build
```

### Backend

```powershell
Set-Location services/backend
.\mvnw.cmd clean test
```

Unit test không cần PostgreSQL. Integration test được đặt tên `*IT.java`, cần một PostgreSQL **riêng cho kiểm thử** và profile `test`; không trỏ integration test vào database phát triển hoặc production.

Ví dụ sau khi đã khởi động một database kiểm thử riêng và thiết lập biến môi trường `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`:

```powershell
$env:TEST_DB_URL = "jdbc:postgresql://localhost:5432/thuyetminh_test"
$env:TEST_DB_USERNAME = "thuyetminh"
$env:TEST_DB_PASSWORD = "<mật-khẩu-test>"
.\mvnw.cmd verify
```

Profile test có thể chạy Flyway migration/clean trên database kiểm thử. **Chỉ dùng database test có thể xóa dữ liệu**, không dùng database local cần giữ hoặc database production.

## CI/CD

GitHub Actions workflow tại `.github/workflows/ci.yml` tự chạy khi push hoặc mở/cập nhật Pull Request. Nó kiểm tra tài liệu nền tảng, whitespace, unit test backend và lint/test/build của Admin. Integration test phụ thuộc PostgreSQL và E2E chưa được đưa vào workflow hiện tại.

**CI có; CD chưa bật.** Không có deployment production tự động. Xem [hướng dẫn CI/CD](docs/operations/ci-cd.md) và [ghi chú triển khai](docs/operations/deployment.md) trước khi cấu hình hosting, secrets, database production, HTTPS và lưu trữ media.

## Dừng dịch vụ local

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

Lệnh trên giữ lại named volumes. **Không thêm `-v`** trừ khi chủ động muốn xóa dữ liệu PostgreSQL và media local.

## Bảo mật

- Không commit `.env`, mật khẩu, token hoặc tệp Google service-account.
- Không đặt bí mật trong biến frontend `VITE_*`.
- Dùng PostgreSQL riêng cho integration test.
- Chỉ bật bootstrap Admin khi khởi tạo môi trường local, sau đó tắt.
- Không coi cấu hình Compose local là cấu hình production.
