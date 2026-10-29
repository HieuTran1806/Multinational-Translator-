# Multitional Translator

Nền tảng thuyết minh đa ngôn ngữ gồm Web User, Web Admin và REST API Spring Boot.

## Hai cách chạy được hỗ trợ

### 1. Web User — production trên Internet

```text
Trình duyệt khách tham quan
  -> https://multitional-translator-web.pages.dev (Cloudflare Pages)
  -> https://multitional-translator-api.onrender.com (Render)
  -> Neon PostgreSQL
```

- Web User production: <https://multitional-translator-web.pages.dev/welcome>
- Backend API production: <https://multitional-translator-api.onrender.com>
- Cấu hình build trên hosting: `VITE_API_BASE_URL=https://multitional-translator-api.onrender.com`, `VITE_USE_MOCK=false`.
- Web User gọi API; không kết nối trực tiếp tới Neon. Chỉ backend giữ thông tin xác thực database.

### 2. Web Admin — chạy local, dùng chung Neon

```text
http://localhost:5173 (apps/admin)
  -> http://localhost:18081 (Spring Boot local, profile local-neon)
  -> Neon PostgreSQL
```

Yêu cầu: Windows/PowerShell, Git, Node.js 22.11+, npm, Java 21 và Internet. Không cần Docker Desktop.

**Cảnh báo:** backend local ghi trực tiếp vào Neon branch được khai báo trong file `.env.local` tại thư mục gốc. Xác nhận đúng project/branch trước khi sửa dữ liệu. Không chạy integration test hoặc thao tác phá huỷ trên database production.

1. Tạo/kiểm tra file `.env.local` ở thư mục gốc, có `DATABASE_URL` ở dạng `postgresql://...` cho Neon branch mong muốn. Không commit hoặc chia sẻ giá trị này.
2. Mở terminal thứ nhất tại thư mục gốc và chạy:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/run-local-neon.ps1
   ```

   Script chuyển URI sang JDBC, giữ SSL, loại bỏ `channel_binding` không được pgJDBC hỗ trợ, không in thông tin xác thực và chạy profile `local-neon` trên cổng `18081`. Profile chỉ dùng Flyway migrations, không nạp dữ liệu demo và không fallback sang database local.
3. Đợi backend sẵn sàng tại <http://localhost:18081/actuator/health>.
4. Mở terminal thứ hai:

   ```powershell
   Set-Location "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-\apps\admin"
   npm ci
   npm run dev
   ```

5. Mở <http://localhost:5173>. Đảm bảo `apps/admin/.env`/`.env.local` (nếu tồn tại) đặt `VITE_API_BASE_URL=http://localhost:18081` và `VITE_USE_MOCK=false`. Khởi động lại Vite sau khi sửa biến môi trường.

Kiểm tra Admin dùng đúng backend trong DevTools → Network: request API phải tới `localhost:18081`. Health `200` không tự chứng minh backend đang nối đúng Neon branch; xác nhận branch qua cấu hình kết nối đã thiết lập.

## Cấu hình quan trọng

| Thành phần | Cấu hình |
|---|---|
| Web User production | `VITE_API_BASE_URL=https://multitional-translator-api.onrender.com` |
| Web User mock | `VITE_USE_MOCK=false` trong build production |
| Web Admin local | `VITE_API_BASE_URL=http://localhost:18081` |
| Web Admin mock | `VITE_USE_MOCK=false` khi dùng hệ thống thật |
| Backend local Admin | `SPRING_PROFILES_ACTIVE=local-neon`, cổng mặc định `18081` |
| Database | Neon PostgreSQL; chỉ backend kết nối |

Không đặt `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DATABASE_URL`, token hoặc credentials trong biến `VITE_*`, frontend bundle, source code hay tài liệu. Không bật mock để xác minh tích hợp backend/database thật.

## Kiểm tra chất lượng

Các lệnh dưới đây là kiểm tra chất lượng, không phải phương án chạy ứng dụng thay thế.

```powershell
# Admin
Set-Location "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-\apps\admin"
npm ci
npm run lint
npm test
npm run build

# Web User
Set-Location "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-\apps\web"
npm ci
npm run lint
npm test
npm run build

# Backend unit tests (không cần database)
Set-Location "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-\services\backend"
.\mvnw.cmd clean test
```

Integration tests (`mvnw verify`) cần database kiểm thử riêng qua `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`. Không dùng Neon production, database phát triển hoặc dữ liệu dùng chung làm database test.

## Triển khai và bí mật

- Web User được host trên Cloudflare Pages; backend được host trên Render; cả hai phải được cấu hình dùng cùng Neon database theo môi trường đã xác nhận.
- Web Admin chỉ chạy local, không triển khai lên hosting công khai.
- Quản lý biến môi trường và secrets trong dashboard hosting hoặc file môi trường local bị Git ignore. Không đưa secrets vào Git hay nhật ký.
- `APP_CORS_ALLOWED_ORIGINS` trên Render chỉ cần origin Web User production; Admin mặc định gọi backend local, và profile `local-neon` cho phép origin Admin local.
- Backend dùng Flyway quản lý schema. Không sửa migration đã áp dụng; tạo migration mới khi cần thay đổi schema.

## Xử lý lỗi thường gặp

| Triệu chứng | Kiểm tra |
|---|---|
| Cổng `5173` hoặc `18081` đã được dùng | Dừng tiến trình cũ trước khi chạy lại. |
| Admin gọi sai backend | Kiểm tra `VITE_API_BASE_URL` trong `.env` và `.env.local`; `.env.local` có ưu tiên cao hơn. Restart Vite. |
| Backend không khởi động | Kiểm tra `DATABASE_URL` trong file `.env.local` mà không in/ghi lại giá trị; kiểm tra kết nối mạng, SSL, profile và log đã che secrets. |
| Lỗi Flyway/schema | Xác minh Neon project/branch và lịch sử migration trước khi sửa dữ liệu. |
| API trả `401`/`403` | Đăng nhập lại và kiểm tra quyền tài khoản. |
| Lỗi CORS | Kiểm tra origin chính xác và `APP_CORS_ALLOWED_ORIGINS` của backend đích. |
| Admin đã lưu nhưng User chưa thấy dữ liệu | Kiểm tra POI đã publish chưa và xác minh hai backend trỏ cùng Neon database. Tải lại Web User. |

Tài liệu liên quan: [Kiến trúc](docs/architecture/architecture.md) · [API contract](docs/architecture/api.md) · [Use Cases](docs/requirements/Use_Case_Specification_Final_15_UC.md) · [Web Admin](apps/admin/README.md) · [Web User](apps/web/README.md) · [Backend](services/backend/README.md) · [Triển khai](docs/operations/deployment.md) · [CI](docs/operations/ci-cd.md).
