# Chuẩn bị triển khai (chưa triển khai thật)

Tài liệu này chỉ mô tả cấu hình. Không có tài nguyên trả phí nào được tạo và chưa có deploy nào được thực hiện.

## 1. Web admin trên Vercel

| Mục | Giá trị |
|---|---|
| Root Directory | `apps/admin` |
| Framework preset | Vite |
| Install / Build | `npm ci` / `npm run build` |
| Output | `dist` |
| Node | 22 |
| Biến môi trường | `VITE_API_BASE_URL=https://api.<domain>` — **public**, được nhúng vào bundle; không đặt bí mật nào với tiền tố `VITE_` |
| SPA routing | `apps/admin/vercel.json` rewrite mọi path về `/index.html` (F5 ở `/pois/12` không 404) |
| Header bảo mật | `vercel.json` đặt `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |

## 2. Backend trên Render hoặc VPS (Docker)

Image: `services/backend/Dockerfile` (multi-stage, chạy user không phải root, `SPRING_PROFILES_ACTIVE=prod` mặc định).

| Mục | Giá trị |
|---|---|
| Port | Render cấp biến `PORT`; Spring đọc `server.port=${PORT:8080}` |
| Health check path | `/actuator/health/readiness` (hoặc `/actuator/health`) |
| Bắt buộc | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `APP_CORS_ALLOWED_ORIGINS=https://admin.<domain>` |
| Tuỳ chọn | `APP_AUTH_SESSION_TTL`, `APP_TTS_PROVIDER=google`, `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-tts.json` (Render "Secret Files"), `APP_API_DOCS_ENABLED=false` |
| Admin đầu tiên | Bật `APP_BOOTSTRAP_ADMIN_*` một lần với mật khẩu mạnh trong Secret, rồi tắt |

VPS: `docker run -d --restart=unless-stopped -p 127.0.0.1:8080:8080 --env-file /etc/thuyetminh/backend.env -v /srv/thuyetminh/media:/app/data/media <image>` phía sau reverse proxy (Caddy/Nginx) có HTTPS.

Secrets không bao giờ nằm trong image, repo hay log. Backend không log mật khẩu, token hoặc nội dung file credential.

## 3. PostgreSQL production và migration

- Dùng PostgreSQL managed (Render Postgres, Neon, Supabase, Cloud SQL…) hoặc PostgreSQL trên VPS có backup.
- Flyway chạy tự động khi backend khởi động (`classpath:db/migration`). Profile `prod` **không** nạp `db/demo`.
- Hibernate chạy `ddl-auto=validate`: nếu entity lệch schema, app không khởi động (an toàn hơn tự sửa schema).
- Không bao giờ sửa migration đã chạy; thêm `V3__...sql` mới.
- Nên tạo user DB riêng cho app; quyền DDL có thể tách sang job migration riêng khi hệ thống lớn hơn.

## 4. Lưu trữ audio/ảnh bền vững

`LocalMediaStorage` ghi vào `APP_STORAGE_LOCAL_ROOT` (`/app/data/media` trong container).

- **Filesystem tạm của container sẽ mất khi redeploy.** Bắt buộc gắn đĩa bền vững (Render Persistent Disk, volume Docker trên VPS) hoặc
- triển khai `MediaStorage` cho object storage (S3/GCS/R2) — chỉ cần thêm một class implement interface và chọn bằng cấu hình; DB chỉ lưu `storage_key` nên không phải migrate dữ liệu.
- Backup: snapshot volume/bucket định kỳ, cùng lịch với backup DB để giữ nhất quán `storage_key` ↔ file.

## 5. HTTPS, domain, CORS, backup

- HTTPS bắt buộc cho backend và admin ở production (Render/Vercel cấp sẵn chứng chỉ; VPS dùng Caddy/Let's Encrypt).
- Bản Android **release** chặn HTTP (cleartext chỉ bật cho debug) → backend phải là HTTPS.
- `APP_CORS_ALLOWED_ORIGINS` chỉ chứa domain admin chính xác (không `*`).
- Mobile không cần CORS.
- Backup DB hằng ngày + kiểm tra khôi phục định kỳ.

## 6. Ứng dụng di động

Android/iOS **không** deploy lên Vercel. Quy trình riêng:

- Android: ký bản release bằng keystore riêng (không commit), build `.aab`, phát hành qua Google Play Console (internal testing trước).
- iOS: cần macOS/Xcode, Apple Developer account, TestFlight.
- Cấu hình `API_BASE_URL=https://api.<domain>` và Maps key đã giới hạn theo package/bundle trong `.env` khi build.

## 7. Một cơ chế kích hoạt deploy duy nhất

Chọn **một** trong hai, tránh deploy trùng:

| Phương án | Cách làm |
|---|---|
| A. Hosting tự deploy khi push `main` | Bật auto-deploy trên Render/Vercel; **không** dùng workflow deploy. Bật branch protection để `main` chỉ nhận commit đã qua CI |
| B. GitHub Actions kích hoạt deploy (khuyến nghị) | Tắt auto-deploy trên Render/Vercel; dùng mẫu trong `docs/cd-templates/` (chạy sau khi workflow CI thành công trên `main`) |

Mẫu CD **chưa được kích hoạt** (nằm ngoài `.github/workflows/`). CI hiện tại chỉ kiểm tra và build; CD chỉ hoạt động khi đã cấu hình hosting và secrets.
