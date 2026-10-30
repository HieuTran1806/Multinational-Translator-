# Multitional Translator

Nền tảng thuyết minh đa ngôn ngữ trên Web. Hệ thống gồm Web User dành cho khách tham quan, Web Admin dành cho vận hành nội dung và một REST API Spring Boot.

## Phạm vi đang triển khai

- User: chọn ngôn ngữ, kích hoạt quyền bằng QR dùng một lần, khám phá POI đã công khai, xem chi tiết và nghe audio.
- Admin: đăng nhập; quản lý POI, bản dịch, hình ảnh, audio, tác vụ Google TTS, QR truy cập và Analytics.
- Super Admin: quản lý tài khoản Admin và tra cứu Audit Log.
- Không có Seller Management, Payment/Order hoặc Dynamic RBAC.
- User không có account trong bảng account; quyền truy cập User là grant phát sinh từ QR và gắn với thiết bị.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Web User | React 19, React Router 7, Vite 8, Leaflet, OpenStreetMap |
| Web Admin | React 19, React Router 7, Vite 8 |
| Backend | Java 21, Spring Boot 4.1.1, Spring Security, Spring Data JPA |
| Database | PostgreSQL, Flyway |
| Media | MediaStorage adapter; hỗ trợ local storage và Cloudflare R2 |
| TTS | Google Cloud Text-to-Speech adapter; mặc định provider none nếu chưa cấu hình |
| Tests | Vitest, React Testing Library, JUnit, Spring test, Maven Surefire/Failsafe |
| CI | GitHub Actions |

## Kiến trúc tổng quan

- Web User production: Cloudflare Pages → Backend trên Render → Neon PostgreSQL.
- Web Admin: chỉ chạy local; gọi backend local dùng profile local-neon → Neon PostgreSQL.
- Frontend chỉ gọi REST API. Chỉ backend giữ database credentials và truy cập database.
- Web User dùng Leaflet + OpenStreetMap; không có ứng dụng mobile trong repository hiện tại.

## Cấu trúc repository

- apps/web: Web User, API client, access grant, bản đồ, POI, audio và frontend tests.
- apps/admin: Web Admin, authentication, POI editor, QR, Analytics, Audit Log, tài khoản Admin và frontend tests.
- services/backend: REST API, domain services, persistence adapters, security, scheduled jobs và Flyway migrations.
- docs: tài liệu chuẩn của dự án.
- scripts: script chạy backend local, bootstrap tài khoản và vận hành media.
- infra, design-system: tài nguyên hạ tầng và thiết kế hiện có.
- .agents, .github: agent skills và GitHub workflows; không phải tài liệu nghiệp vụ thay thế.

## Yêu cầu môi trường

- Windows/PowerShell hoặc môi trường tương đương.
- Node.js >= 22.11 và npm.
- Java 21.
- Git.
- Kết nối Internet khi gọi backend/Neon và dịch vụ ngoài.
- Không bắt buộc Docker cho luồng chạy Web Admin local-neon.

## Chạy Web Admin local

Cảnh báo: backend local dùng profile local-neon và có quyền ghi vào Neon branch được cấu hình. Xác minh đúng project/branch trước khi chạy thao tác ghi. Không dùng production làm database kiểm thử.

1. Tạo file .env.local ở repository root với DATABASE_URL là PostgreSQL URI của branch được phép dùng và các biến R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (R2_REGION mặc định auto) cho media storage. Script import các biến trong file này vào backend process. Không commit hoặc chia sẻ các giá trị.
2. Tại repository root, chạy script scripts/run-local-neon.ps1 bằng PowerShell. Script chuyển DATABASE_URL sang cấu hình JDBC và chạy backend ở cổng 18081.
3. Chờ health endpoint tại http://localhost:18081/actuator/health trả trạng thái sẵn sàng.
4. Mở terminal khác, vào apps/admin, chạy npm ci rồi npm run dev.
5. Mở http://localhost:5173. Kiểm tra request API đi tới http://localhost:18081 và VITE_USE_MOCK=false.

## Chạy Web User local

1. Vào apps/web.
2. Chạy npm ci và npm run dev.
3. Cấu hình VITE_API_BASE_URL trỏ tới backend cần dùng; backend phải cho phép origin frontend qua APP_CORS_ALLOWED_ORIGINS.
4. Chỉ bật VITE_USE_MOCK=true khi muốn chạy mock cục bộ. Không dùng mock để xác minh tích hợp backend/database thật.

## Kiểm tra chất lượng

Chạy trong từng thư mục apps/web và apps/admin:

- npm ci
- npm run lint
- npm test
- npm run build

Chạy trong services/backend:

- .\mvnw.cmd clean test — unit tests, không cần database.
- .\mvnw.cmd verify — chạy thêm integration tests; cần PostgreSQL test riêng qua TEST_DB_URL, TEST_DB_USERNAME và TEST_DB_PASSWORD.

Không chạy integration tests trên Neon production, database dùng chung hoặc dữ liệu phát triển.

## Triển khai

- Web User: Cloudflare Pages; build root apps/web, output dist, dùng VITE_API_BASE_URL và VITE_USE_MOCK=false.
- Backend: Render; profile prod, DB_URL/DB_USERNAME/DB_PASSWORD và APP_CORS_ALLOWED_ORIGINS lấy từ cấu hình secrets của hosting.
- Web Admin: local-only; không triển khai lên hosting công khai.
- Media production có adapter Cloudflare R2. Cần giữ database backup và media backup nhất quán theo storage_key.

## Bảo mật và bảo trì

- Không đưa secrets, DATABASE_URL, DB_PASSWORD, token, service-account key hoặc credentials vào Git, frontend VITE_* hoặc tài liệu.
- Không sửa migration Flyway đã phát hành; thêm migration mới.
- Không thay đổi source code chỉ để khớp tài liệu.
- Backend là nơi thực thi authentication/authorization; ẩn route hoặc nút trên UI không thay thế kiểm tra quyền.
- Không push Git nếu chưa có yêu cầu riêng.

## Tài liệu chuẩn

- [Use Cases](docs/USE_CASES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Development](docs/DEVELOPMENT.md)
- [Code control cheatsheet](docs/CODE_CONTROL_MAINTENANCE_CHEATSHEET.md)
- [Neon database cheatsheet](docs/NEON_DATABASE_CHEATSHEET.md)
