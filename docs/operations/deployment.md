# Chuẩn bị triển khai (chưa triển khai thật)

Tài liệu này chỉ mô tả cấu hình. Chưa tạo tài nguyên trả phí và chưa thực hiện triển khai nào.

## 1. Ứng dụng web Admin trên Vercel

| Mục | Giá trị |
|---|---|
| Thư mục gốc | `apps/admin` |
| Cấu hình framework | Vite |
| Cài đặt / Biên dịch | `npm ci` / `npm run build` |
| Thư mục đầu ra | `dist` |
| Phiên bản Node.js | 22 |
| Biến môi trường | `VITE_API_BASE_URL=https://api.<domain>` — **công khai**, được nhúng vào gói ứng dụng; không đặt bí mật nào với tiền tố `VITE_` |
| Định tuyến SPA | `apps/admin/vercel.json` chuyển mọi đường dẫn về `/index.html` (F5 ở `/pois/12` không 404) |
| Header bảo mật | `vercel.json` đặt `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |

## 2. Backend trên Render hoặc VPS (Docker)

Image: `services/backend/Dockerfile` (nhiều giai đoạn, chạy bằng người dùng không phải root, mặc định `SPRING_PROFILES_ACTIVE=prod`).

| Mục | Giá trị |
|---|---|
| Cổng | Render cấp biến `PORT`; Spring đọc `server.port=${PORT:8080}` |
| Đường dẫn kiểm tra tình trạng | `/actuator/health/readiness` (hoặc `/actuator/health`) |
| Bắt buộc | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `APP_CORS_ALLOWED_ORIGINS=https://admin.<domain>` |
| Tùy chọn | `APP_AUTH_SESSION_TTL`, `APP_TTS_PROVIDER=google`, `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-tts.json` (tệp bí mật của Render), `APP_API_DOCS_ENABLED=false` |
| Admin đầu tiên | Bật `APP_BOOTSTRAP_ADMIN_*` một lần với mật khẩu mạnh trong kho bí mật, rồi tắt |

VPS: `docker run -d --restart=unless-stopped -p 127.0.0.1:8080:8080 --env-file /etc/thuyetminh/backend.env -v /srv/thuyetminh/media:/app/data/media <image>` phía sau reverse proxy (Caddy/Nginx) có HTTPS.

Thông tin bí mật không bao giờ được đưa vào image, kho mã nguồn hoặc nhật ký. Backend không ghi mật khẩu, token hay nội dung tệp thông tin xác thực vào nhật ký.

## 3. PostgreSQL môi trường production và migration

- Dùng PostgreSQL được quản lý bởi nhà cung cấp (Render Postgres, Neon, Supabase, Cloud SQL…) hoặc PostgreSQL trên VPS có backup.
- Flyway chạy tự động khi backend khởi động (`classpath:db/migration`). Cấu hình `prod` **không** nạp `db/demo`.
- Hibernate chạy `ddl-auto=validate`: nếu entity không khớp schema, app không khởi động (an toàn hơn tự sửa schema).
- Không bao giờ sửa migration đã chạy; thêm `V3__...sql` mới.
- Nên tạo user DB riêng cho app; quyền DDL có thể tách sang job migration riêng khi hệ thống lớn hơn.

## 4. Lưu trữ âm thanh/hình ảnh bền vững

`LocalMediaStorage` ghi vào `APP_STORAGE_LOCAL_ROOT` (`/app/data/media` trong container).

- **Hệ thống tệp tạm của container sẽ mất khi triển khai lại.** Bắt buộc gắn đĩa bền vững (Render đĩa lưu trữ bền vững, volume Docker trên VPS) hoặc
- triển khai `MediaStorage` cho lưu trữ đối tượng (S3/GCS/R2) — chỉ cần thêm một class implement interface và chọn bằng cấu hình; DB chỉ lưu `storage_key` nên không phải migrate dữ liệu.
- Sao lưu: tạo snapshot volume/bucket định kỳ, cùng lịch với sao lưu cơ sở dữ liệu để giữ nhất quán `storage_key` ↔ file.

## 5. HTTPS, tên miền, CORS và sao lưu

- HTTPS bắt buộc cho backend và admin trong môi trường production (Render/Vercel cấp sẵn chứng chỉ; VPS dùng Caddy/Let's Encrypt).
- Bản Android **phát hành** chặn HTTP (cleartext chỉ bật cho bản gỡ lỗi) → backend phải là HTTPS.
- `APP_CORS_ALLOWED_ORIGINS` chỉ chứa tên miền Admin chính xác (không `*`).
- Ứng dụng di động không cần CORS.
- Sao lưu cơ sở dữ liệu hằng ngày và kiểm tra khôi phục định kỳ.

## 6. Ứng dụng di động

Android/iOS **không** triển khai lên Vercel. Quy trình riêng:

- Android: ký bản phát hành bằng keystore riêng (không commit), biên dịch `.aab` và phát hành qua Google Play Console (thử nghiệm nội bộ trước).
- iOS: cần macOS/Xcode, tài khoản Apple Developer, TestFlight.
- Cấu hình `API_BASE_URL=https://api.<domain>` và khóa API Maps đã giới hạn theo package/bundle trong `.env` khi biên dịch.

## 7. Chỉ sử dụng một cơ chế kích hoạt triển khai

Chọn **một** trong hai, tránh triển khai trùng lặp:

| Phương án | Cách làm |
|---|---|
| A. Hosting tự triển khai khi đẩy mã lên `main` | Bật tự động triển khai trên Render/Vercel; **không** dùng workflow triển khai. Bật bảo vệ nhánh để `main` chỉ nhận commit đã vượt qua CI |
| B. GitHub Actions kích hoạt triển khai (khuyến nghị) | Tắt tự động triển khai trên Render/Vercel; dùng mẫu trong `docs/operations/cd-templates/` (chạy sau khi workflow CI thành công trên `main`) |

Mẫu CD **chưa được kích hoạt** (nằm ngoài `.github/workflows/`). CI hiện tại chỉ kiểm tra và biên dịch; CD chỉ hoạt động sau khi cấu hình dịch vụ lưu trữ và thông tin bí mật.
