# Development Guide

## 1. Runtime và công cụ

| Công cụ | Yêu cầu |
|---|---|
| Node.js | >= 22.11 |
| npm | Đi kèm Node.js |
| Java | 21 |
| Maven | Dùng Maven Wrapper trong services/backend |
| Database | PostgreSQL; Neon dùng cho cấu hình local-neon |
| Docker | Không cần cho luồng Web Admin local-neon; integration tests vẫn cần database test riêng |

## 2. Cài đặt dependencies

Mỗi frontend là một ứng dụng độc lập, có package-lock riêng:

- apps/web: npm ci
- apps/admin: npm ci

Backend dùng Maven Wrapper tại services/backend/mvnw.cmd. Không cài thêm Maven global nếu wrapper hoạt động.

## 3. Cấu hình môi trường

### Frontend

- VITE_API_BASE_URL: API origin; không có trailing slash.
- VITE_USE_MOCK: true chỉ để phát triển/test bằng mock; false để gọi backend thật.
- Không đặt DB_URL, DATABASE_URL, DB_USERNAME, DB_PASSWORD hoặc service credentials trong VITE_* vì các giá trị VITE_* được nhúng vào frontend bundle.

Web User mặc định đọc API base URL rỗng; Vite dev server có thể proxy API theo vite.config.js. Web Admin có .env.example với backend local tại localhost:18081.

### Backend

Cấu hình chung trong application.yml; các biến môi trường quan trọng:

| Biến | Ý nghĩa |
|---|---|
| DB_URL | JDBC URL PostgreSQL |
| DB_USERNAME / DB_PASSWORD | Database credentials |
| APP_CORS_ALLOWED_ORIGINS | Danh sách origin cách nhau bằng dấu phẩy |
| APP_AUTH_SESSION_TTL | Thời hạn Admin session; mặc định 8h |
| APP_ACCESS_DEFAULT_PACKAGE | Gói QR mặc định; mặc định DEMO_24H |
| APP_ACCESS_ACTIVATION_URL | Base URL trang kích hoạt QR |
| APP_BOOTSTRAP_ADMIN_ENABLED | Bật/tắt bootstrap account; mặc định false |
| APP_BOOTSTRAP_ADMIN_USERNAME / PASSWORD | Thông tin bootstrap; không lưu trong Git |
| APP_BOOTSTRAP_ADMIN_ROLE | ADMIN hoặc SUPER_ADMIN; mặc định SUPER_ADMIN |
| APP_STORAGE_PROVIDER | local hoặc r2 |
| APP_STORAGE_LOCAL_ROOT | Thư mục media local; mặc định ./data/media |
| R2_ENDPOINT | S3-compatible endpoint của Cloudflare R2 |
| R2_BUCKET | Tên bucket media |
| R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY | Credentials R2, chỉ đặt ở backend runtime/secret store |
| R2_REGION | Region R2; thường là auto |
| APP_UPLOAD_MAX_AUDIO_BYTES | Mặc định 20 MiB |
| APP_UPLOAD_MAX_IMAGE_BYTES | Mặc định 5 MiB |
| APP_TTS_PROVIDER | none hoặc google |
| GOOGLE_APPLICATION_CREDENTIALS | Đường dẫn ADC credential file/service account; giữ ngoài Git |
| APP_TTS_MAX_INPUT_BYTES | Mặc định 4500 byte UTF-8 |
| APP_TTS_REQUEST_TIMEOUT | Mặc định 30s |
| APP_TTS_MAX_ATTEMPTS | Mặc định 3 |
| APP_TTS_WORKER_ENABLED | Bật/tắt TTS worker |

Bootstrap account chỉ tạo khi được bật rõ ràng. Username phải đúng pattern 3–64 ký tự; mật khẩu bootstrap tối thiểu 12 ký tự. Nếu username đã tồn tại, runner không ghi đè mật khẩu. Tắt APP_BOOTSTRAP_ADMIN_ENABLED sau khi bootstrap. Không tự nâng role tài khoản đang tồn tại.

### Google Cloud TTS

Mã adapter Google Cloud TTS có trong backend. Để gọi provider thật cần bật Cloud Text-to-Speech API, tạo service account có quyền tối thiểu và cấu hình APP_TTS_PROVIDER=google cùng GOOGLE_APPLICATION_CREDENTIALS (Application Default Credentials). Credentials phải được lưu ngoài repository hoặc trong secret manager của hosting. TTS không dịch thuật; nội dung từng ngôn ngữ phải được Admin nhập riêng. Khi provider chưa cấu hình, backend vẫn chạy và TTS trả trạng thái chưa cấu hình; upload audio vẫn có thể dùng. Mã tích hợp tồn tại nhưng chưa được gọi thử với Google thật trong lượt audit này.

## 4. Chạy ứng dụng local

### 4.1 Backend local cho Admin

Cấu hình này dùng Neon branch trong file .env.local tại repository root. Đây là kết nối có quyền ghi; không dùng branch production cho thử nghiệm phá hủy.

1. Đặt DATABASE_URL trong root .env.local cùng R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (R2_REGION mặc định auto). Script import toàn bộ biến trong file này; profile local-neon yêu cầu cấu hình R2 cho media storage. Giữ file ngoài Git.
2. Từ repository root, chạy: powershell -ExecutionPolicy Bypass -File scripts/run-local-neon.ps1
3. Script chạy profile local-neon, backend cổng 18081, giữ SSL và không nạp demo seed.
4. Kiểm tra http://localhost:18081/actuator/health.

Profile local-neon fail-fast khi thiếu DB_*; không fallback sang database local.

### 4.2 Web Admin

Trong terminal khác:

1. cd apps/admin
2. npm ci
3. npm run dev
4. Mở http://localhost:5173.

Xác minh DevTools Network: API phải gọi localhost:18081 và VITE_USE_MOCK=false.

### 4.3 Web User

1. cd apps/web
2. npm ci
3. npm run dev
4. Cấu hình VITE_API_BASE_URL nếu backend không cùng origin/proxy mặc định.
5. Backend phải cho phép origin User qua APP_CORS_ALLOWED_ORIGINS.

## 5. Test

### Web User và Web Admin

Trong từng thư mục ứng dụng:

- npm run lint
- npm test
- npm run build

Vitest test không chứng minh API/database thật hoạt động nếu test đang mock endpoint.

### Backend unit tests

Từ services/backend:

- .\mvnw.cmd clean test

Surefire chạy test thường và loại trừ class *IT.java. Unit suite không cần PostgreSQL.

### Backend integration tests

- .\mvnw.cmd verify

Failsafe chạy class *IT.java. Cần PostgreSQL test riêng qua TEST_DB_URL, TEST_DB_USERNAME, TEST_DB_PASSWORD. Xác minh database test là isolated trước khi chạy. Không dùng Neon production hoặc branch có dữ liệu thật.

### Admin end-to-end

- cd apps/admin rồi chạy npm run verify:e2e.
- Script scripts/verify-e2e.mjs gọi backend và database thật; kiểm tra Admin POI/translation/media/publish, User public API, QR redeem/revoke, grant, fallback, audio/image và offline-manifest endpoint.
- Có thể cấu hình E2E_BASE_URL, E2E_ADMIN_USERNAME, E2E_ADMIN_PASSWORD; E2E_SUPER_USERNAME/E2E_SUPER_PASSWORD bật thêm bước kiểm tra Super Admin. Mặc định BASE URL là localhost:8080, tài khoản mặc định là tài khoản demo; với backend local-neon phải đặt E2E_BASE_URL=http://127.0.0.1:18081.
- CẢNH BÁO: script tạo POI và QR, sau đó soft-delete POI và revoke QR ở cleanup; Audit Log cũng có thể phát sinh. Chỉ chạy trên database E2E cô lập, không chạy trên production hoặc database dùng chung.

### OpenAPI / Swagger

- API spec: /v3/api-docs.
- Swagger UI: /swagger-ui/index.html (Springdoc default; /swagger-ui.html có thể chuyển hướng).
- Production tắt API docs và Swagger UI theo mặc định; APP_API_DOCS_ENABLED=true chỉ bật khi có quyết định vận hành rõ ràng.

### Kiểm thử quyền

Tối thiểu kiểm tra:
- ADMIN được phép POI/media/QR/Analytics.
- SUPER_ADMIN bị 403 với POI/media/QR/Analytics.
- SUPER_ADMIN được phép Accounts/Audit.
- ADMIN bị 403 với Accounts/Audit.
- Visitor grant hợp lệ được phép public POI/media và usage events.
- Thiếu/hết hạn/revoked grant bị từ chối.

## 6. Build

- Web User: npm run build hoặc npm run build:production trong apps/web.
- Web Admin: npm run build hoặc npm run build:production trong apps/admin.
- Backend: .\mvnw.cmd package hoặc .\mvnw.cmd verify tùy mục đích.

Build output nằm trong dist/ hoặc services/backend/target; không commit build artifacts.

## 7. Database và migrations

- Flyway quản lý schema; JPA ddl-auto=validate.
- Không sửa migration đã phát hành; thêm migration mới.
- Kiểm tra migration trên database riêng trước khi áp dụng môi trường dùng chung.
- Profile prod và local-neon chỉ nạp db/migration; không nạp demo seed.
- Demo SQL nằm trong services/backend/src/main/resources/db/demo; chỉ profile dev nạp classpath:db/demo. Tài khoản demo và QR mẫu được mô tả tại services/backend/src/main/resources/db/demo/README.md; mật khẩu/QR mẫu yếu, chỉ dùng local và không dùng public.
- Không chạy test trên production. Kiểm tra đúng project/branch trước mọi thao tác database.

## 8. CI và deployment

### CI

.github/workflows/ci.yml là workflow CI hiện có. CI chạy kiểm tra backend unit, Admin lint/test/build và Web User lint/test/build cùng contract documentation check. Integration tests và browser E2E chưa phải job CI hiện hành.

### Deployment

- Web User: Cloudflare Pages; root apps/web; output dist; VITE_USE_MOCK=false.
- Backend: Render; profile prod; DB credentials và CORS lấy từ environment/secret settings.
- Web Admin: local-only, không triển khai công khai.
- Database: Neon PostgreSQL.
- Media production: R2 adapter; backup database và R2 cần đồng bộ.

Không có workflow CD hoạt động trong .github/workflows tại thời điểm audit. Không thêm workflow deploy thứ hai khi chưa thống nhất nguồn triển khai, smoke test và rollback.

### Di chuyển media sang Cloudflare R2

Script scripts/migrate-media-to-r2.ps1 hỗ trợ chuyển object hiện có mà không đổi storage_key:

1. Chạy dry-run: powershell -ExecutionPolicy Bypass -File scripts/migrate-media-to-r2.ps1
2. Chỉ sau khi preflight đạt và đã xác minh đúng bucket/credentials, mới chạy -Execute.
3. Script preflight các file local và object R2, upload rồi đọc lại để xác minh SHA-256; không ghi database và không xóa file nguồn.
4. Chỉ chuyển APP_STORAGE_PROVIDER=r2 sau khi upload/verify đạt; giữ file nguồn tới khi đã kiểm tra Admin upload, User image/audio playback và byte-range seeking trên môi trường đích.

### Backup và restore

- Backup database Neon và media storage theo cùng một mốc để storage_key vẫn tham chiếu được object.
- Backup/restore phải theo chức năng hiện hành của Neon và Cloudflare R2; không dùng script local hoặc Docker Compose làm quy trình production.
- Thử restore trên môi trường không production; kiểm tra các key ảnh/audio được tham chiếu trước khi mở lại traffic.
- Không tự động xóa record hoặc object chỉ vì phát hiện một phía bị thiếu.

## 9. Debug và xử lý lỗi

| Triệu chứng | Kiểm tra |
|---|---|
| Admin gọi sai API | VITE_API_BASE_URL, .env/.env.local và restart Vite |
| 401 | Token hết hạn/revoked, account disabled/deleted hoặc thiếu grant |
| 403 | Role không được phép; kiểm tra SecurityConfig và service check |
| 404 POI | POI chưa publish, soft-deleted hoặc không có nội dung phù hợp |
| 409 | Duplicate code, rowVersion mismatch, state conflict hoặc DB constraint |
| 413/415 | File quá dung lượng hoặc định dạng không hỗ trợ |
| TTS 503 | APP_TTS_PROVIDER/credentials chưa cấu hình |
| CORS | APP_CORS_ALLOWED_ORIGINS của backend đang được gọi |
| Flyway fail | Đúng database/branch chưa, lịch sử migration và schema có lệch không |
| Media missing | storage_key và object ở local/R2 có tồn tại không |

Không log token, password, database URL hoặc credential provider.

## 10. Quy trình phát triển và bảo trì

1. Xác định Use Case và API/module liên quan trong USE_CASES.md.
2. Truy vết UI/API → Controller → Service → Store/Repository → Database.
3. Giữ business rule ở backend; UI không thay thế authorization.
4. Áp dụng Ponytail: giải pháp nhỏ nhất đáp ứng hành vi; tránh dependency, abstraction và framework mới nếu chưa có nhu cầu.
5. Cập nhật test cùng thay đổi nghiệp vụ.
6. Cập nhật tài liệu canonical khi API, schema, role hoặc luồng vận hành đổi.
7. Kiểm tra git status, git diff, diff --check và danh sách file xóa/tạo trước commit.
8. Không push nếu chưa được yêu cầu.

## 11. Kết quả kiểm thử của lượt audit 2026-10-30

| Suite | Kết quả |
|---|---:|
| Web User Vitest | 74/74 PASS, 12 files |
| Web Admin Vitest | 56/56 PASS, 13 files |
| Backend Maven unit tests | 67/67 PASS |
| Backend integration tests | NOT RUN — chưa chạy verify/database test trong lượt này |
| Admin E2E | NOT RUN — script ghi dữ liệu test; không chạy trên database production/dùng chung |

Web User test output có cảnh báo React act(...) và HTMLMediaElement.pause() của môi trường test; suite vẫn PASS. Admin mock tests có log request/fixture. Kết quả trên chỉ là test đã chạy trong lượt audit, không xác nhận provider Google TTS thật hoặc database production.
