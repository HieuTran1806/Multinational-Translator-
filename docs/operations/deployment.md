# Triển khai mặc định — Web User, Backend và Neon

## Kiến trúc được hỗ trợ

```text
Web User (Cloudflare Pages, Internet)
    -> Backend Spring Boot (Render, HTTPS)
        -> Neon PostgreSQL

Web Admin (local-only: localhost:5173)
    -> Backend Spring Boot local (profile local-neon, localhost:18081)
        -> Neon PostgreSQL
```

Web Admin không được triển khai lên hosting công khai. Cấu hình chạy local chính thức nằm trong `scripts/run-local-neon.ps1` và `services/backend/src/main/resources/application-local-neon.yml`.

## Web User — Cloudflare Pages

- Root directory: `apps/web`.
- Build: `npm ci` rồi `npm run build:production`.
- Output: `dist`.
- Public build variables: `VITE_API_BASE_URL=https://multitional-translator-api.onrender.com`, `VITE_USE_MOCK=false`.
- Sau khi đổi biến build, phải build/deploy lại frontend.

## Backend — Render

- Root/build context: `services/backend`; image từ `services/backend/Dockerfile`.
- Profile: `SPRING_PROFILES_ACTIVE=prod`.
- Render cấp `PORT`; Spring mặc định `8080` nếu chạy ngoài Render.
- Bắt buộc: `DB_URL` ở dạng JDBC trỏ tới đúng Neon database, `DB_USERNAME`, `DB_PASSWORD`, `APP_CORS_ALLOWED_ORIGINS`.
- CORS chỉ cho phép origin Web User production. Admin mặc định gọi backend local; không cần mở CORS Render cho Admin trong kiến trúc mặc định. Không dùng wildcard `*`.
- Health check: `/actuator/health/readiness`.
- Secrets chỉ đặt trong Render Environment/Secret Files; không commit hoặc đưa vào frontend.

## Database — Neon

Cả backend Render và backend local cho Admin phải trỏ tới Neon database/branch đã được xác nhận. Frontend không kết nối trực tiếp tới database. Flyway chạy migrations khi backend khởi động; profile `prod` và `local-neon` không nạp demo seed. Kiểm tra backup/restore và migration trước mọi thay đổi schema.

## Lưu trữ media

Backend production trên Render đã được cấu hình dùng Cloudflare R2 qua `APP_STORAGE_PROVIDER=r2`. Các media đang được Neon tham chiếu đã được upload và xác minh SHA-256; media mới được backend ghi vào R2. Không dựa vào filesystem container production để lưu media. Backup database và R2 cần được quản lý nhất quán để `storage_key` luôn trỏ tới object tồn tại.

## Admin local-only

1. Đặt `DATABASE_URL` trong file `.env.local` tại repository root.
2. Chạy `powershell -ExecutionPolicy Bypass -File scripts/run-local-neon.ps1`.
3. Chạy `npm ci` và `npm run dev` trong `apps/admin`.
4. Mở `http://localhost:5173`; API phải gọi `http://localhost:18081`.

Đây là backend local có quyền ghi vào Neon; kiểm tra branch trước khi thao tác. Không mở cổng backend/Admin ra mạng công cộng.

## Cơ chế deploy

Hosting hiện là nguồn cấu hình triển khai. GitHub Actions hiện chỉ là CI; không có workflow CD đang hoạt động trong `.github/workflows`. Không kích hoạt thêm workflow CD hoặc cấu hình auto-deploy thứ hai nếu chưa quyết định rõ cơ chế deploy và kiểm thử rollback.
