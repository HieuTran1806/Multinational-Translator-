# Neon CLI & Database CRUD Cheatsheet — Multitional-Translator

> Dùng trên Windows PowerShell. Repository: `D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-`.
>
> **Cẩn trọng:** file `.neon` hiện trỏ tới branch `production`. Các lệnh SQL chạy trên branch đang kết nối có thể tác động dữ liệu thật. Hãy xác nhận branch trước khi ghi/xóa; ưu tiên branch thử nghiệm. Không dán connection string, password, API key hoặc token vào chat, log hay Git.

## 1. Neon CLI cơ bản

### Cài đặt / cập nhật / đăng nhập

```powershell
# Kiểm tra CLI
neon --version
neon --help

# Cài đặt hoặc cập nhật Neon CLI (nếu chưa có / cần bản mới)
npm install -g neon@latest

# Đăng nhập
neon auth
```

### Kiểm tra project và branch

Thư mục dự án có file `.neon` để giữ ngữ cảnh project/branch. Không tự ý đổi branch production khi chưa xác nhận.

```powershell
Set-Location 'D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-'

# Xem ngữ cảnh Neon đang liên kết
Get-Content .neon

# Các lệnh xem danh sách tài nguyên
neon projects list
neon branches list
neon databases list
neon roles list

# Mở trang project trên Neon Console
neon open
```

> Nếu phiên bản CLI của bạn yêu cầu tham số project/branch, xem `neon <command> --help`. Không đưa API key vào dòng lệnh hoặc commit vào repository.

### Branch — xem, tạo, chuyển ngữ cảnh

```powershell
# Xem branch hiện có
neon branches list

# Tạo branch thử nghiệm từ branch hiện tại/default
neon branches create --name it-test

# Chuyển ngữ cảnh dự án sang branch cần dùng
neon checkout it-test

# Lấy lại biến môi trường do Neon quản lý (kiểm tra trước khi ghi đè file .env)
neon env pull

# So sánh schema branch hiện tại với branch khác
neon diff production

# Xem trợ giúp cho các tùy chọn cụ thể
neon branches create --help
neon checkout --help
neon env pull --help
```

**Lưu ý:** tạo branch có thể yêu cầu chọn parent branch hoặc thêm tham số theo phiên bản CLI. Trước khi tạo/xóa branch, đọc `--help` và xác minh branch nguồn/đích. Xóa branch là thao tác phá hủy.

### Kết nối PostgreSQL / chạy SQL

```powershell
# Mở SQL shell tới branch trong ngữ cảnh .neon
neon psql

# Kết nối branch cụ thể
neon psql production

# Chạy một câu SQL trực tiếp
neon psql production -- -c "SELECT current_database(), current_user, now();"

# Chạy file SQL
neon psql production -- -f .\scripts\my-query.sql
```

Nếu CLI đang dùng cú pháp khác, kiểm tra `neon psql --help`. Một số phiên bản có lệnh `neon connection-string`; connection string có mật khẩu nên tránh xuất ra log/chia sẻ màn hình.

## 2. Xác minh database trước khi thay đổi

Chạy các truy vấn đọc trước để chắc chắn đang ở đúng project, database, schema và branch:

```sql
SELECT current_database() AS database_name,
       current_user AS database_role,
       current_schema() AS schema_name,
       now() AS checked_at;

-- Tất cả bảng trong schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Cột và kiểu dữ liệu thực tế trong DB đang kết nối
SELECT table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Trạng thái Flyway
SELECT installed_rank, version, description, success, installed_on
FROM public.flyway_schema_history
ORDER BY installed_rank;
```

Schema bên dưới được tổng hợp từ các migration V1–V6 trong repository. Nếu DB đã có migration mới hơn, hãy ưu tiên schema thực tế truy vấn từ `information_schema`.

## 3. Quy tắc CRUD an toàn

- Luôn chạy `SELECT` với điều kiện `WHERE` trước khi `UPDATE` hoặc `DELETE`.
- Khi thao tác thủ công, dùng transaction: `BEGIN;` → kiểm tra kết quả → `COMMIT;` hoặc `ROLLBACK;`.
- Không dùng `UPDATE table SET ...` hay `DELETE FROM table;` nếu thiếu `WHERE`.
- ID trong ví dụ là giá trị mẫu: thay bằng ID đã xác minh tồn tại. Các cột FK phải tham chiếu bản ghi hợp lệ.
- Với `account.password_hash`, chỉ ghi BCrypt hash do ứng dụng tạo; **không lưu mật khẩu dạng rõ**.
- Với `audio_asset`, database chỉ lưu metadata; file audio nằm trong media storage. Không tự ý sửa `storage_key` nếu không di chuyển file tương ứng.
- Không tự tạo token QR/grant rồi lưu trực tiếp nếu chưa thực hiện đúng luồng backend: DB lưu hash token, không lưu token rõ.
- `audit_log` là audit trail và `usage_event` là dữ liệu analytics: mặc định chỉ đọc/ghi qua ứng dụng; không sửa/xóa thủ công trừ khi có quy trình retention được duyệt.
- `flyway_schema_history` do Flyway quản lý: **không INSERT/UPDATE/DELETE thủ công**.
- Các bảng có FK `ON DELETE CASCADE` có thể xóa dữ liệu con theo dây chuyền. Kiểm tra FK trước khi xóa.

Mẫu transaction:

```sql
BEGIN;

-- 1) Xem đúng bản ghi sẽ thay đổi
SELECT * FROM public.poi WHERE id = 123;

-- 2) Thực hiện UPDATE/DELETE có WHERE cụ thể
-- UPDATE public.poi SET default_name = 'Tên mới', updated_at = now()
-- WHERE id = 123;

-- 3) Kiểm tra kết quả trước khi commit
SELECT * FROM public.poi WHERE id = 123;

-- Nếu kết quả đúng:
COMMIT;
-- Nếu sai, thay COMMIT bằng:
-- ROLLBACK;
```

## 4. CRUD theo từng bảng

Các lệnh dưới đây là mẫu. Hãy thay dữ liệu mẫu, kiểm tra ràng buộc/foreign key và chỉ chạy lệnh ghi khi đã xác minh đúng branch.

### 4.1 `account` — tài khoản Admin / Super Admin

Các cột chính: `id, username, password_hash, display_name, role, enabled, created_at, updated_at, deleted_at, deleted_by`.

```sql
-- READ: chỉ tài khoản chưa soft-delete
SELECT id, username, display_name, role, enabled, created_at, updated_at
FROM public.account
WHERE deleted_at IS NULL
ORDER BY id;

-- CREATE: thay <BCRYPT_HASH> bằng BCrypt hash hợp lệ được tạo từ ứng dụng
INSERT INTO public.account (username, password_hash, display_name, role)
VALUES ('admin_example', '<BCRYPT_HASH>', 'Admin Example', 'ADMIN')
RETURNING id, username, role;

-- UPDATE
UPDATE public.account
SET display_name = 'Admin Updated',
    enabled = TRUE,
    updated_at = now()
WHERE id = 123 AND deleted_at IS NULL
RETURNING id, username, display_name, enabled;

-- DELETE: ưu tiên soft delete để giữ lịch sử
UPDATE public.account
SET deleted_at = now(),
    updated_at = now()
WHERE id = 123 AND deleted_at IS NULL
RETURNING id, username, deleted_at;
```

Không xóa cứng tài khoản bằng `DELETE FROM account` nếu chưa đánh giá ảnh hưởng tới session, job, audit và dữ liệu liên quan.

### 4.2 `auth_session` — phiên đăng nhập

```sql
-- READ
SELECT id, account_id, created_at, expires_at, last_used_at, revoked_at
FROM public.auth_session
ORDER BY created_at DESC;

-- CREATE: chỉ dùng token_hash SHA-256 hợp lệ do luồng auth tạo
INSERT INTO public.auth_session (account_id, token_hash, expires_at)
VALUES (123, '<SHA256_TOKEN_HASH_64_HEX>', now() + interval '1 day')
RETURNING id, account_id, expires_at;

-- UPDATE: thu hồi session
UPDATE public.auth_session
SET revoked_at = now()
WHERE id = 456 AND revoked_at IS NULL
RETURNING id, revoked_at;

-- DELETE: chỉ dùng khi đã xác minh session không cần giữ
DELETE FROM public.auth_session
WHERE id = 456
RETURNING id;
```

### 4.3 `language` — ngôn ngữ

```sql
-- READ
SELECT * FROM public.language ORDER BY sort_order, code;

-- CREATE
INSERT INTO public.language
(code, name, native_name, tts_language_code, default_tts_voice, enabled, sort_order)
VALUES ('fr', 'French', 'Français', 'fr-FR', NULL, TRUE, 3)
RETURNING *;

-- UPDATE
UPDATE public.language
SET name = 'English', native_name = 'English', enabled = TRUE, sort_order = 2
WHERE code = 'en'
RETURNING *;

-- DELETE: chỉ xóa khi chưa được bản dịch/job tham chiếu
DELETE FROM public.language
WHERE code = 'fr'
  AND NOT EXISTS (SELECT 1 FROM public.poi_translation t WHERE t.language_code = 'fr')
  AND NOT EXISTS (SELECT 1 FROM public.audio_generation_job j WHERE j.language_code = 'fr')
RETURNING code;
```

### 4.4 `poi` — điểm tham quan (POI)

Các cột bổ sung từ migration: `category, trigger_radius, deleted_at`.

```sql
-- READ: POI chưa soft-delete
SELECT id, code, default_name, category, latitude, longitude, status,
       trigger_radius, is_demo, published_at, deleted_at
FROM public.poi
WHERE deleted_at IS NULL
ORDER BY id;

-- CREATE
INSERT INTO public.poi
(code, default_name, latitude, longitude, category, trigger_radius, status)
VALUES ('DEMO_POI_01', 'Điểm tham quan mẫu', 10.1234, 106.1234,
        'Lịch sử', 50.0, 'DRAFT')
RETURNING id, code, default_name;

-- UPDATE
UPDATE public.poi
SET default_name = 'Tên POI đã cập nhật',
    category = 'Lịch sử',
    trigger_radius = 75.0,
    updated_at = now(),
    row_version = row_version + 1
WHERE id = 123 AND deleted_at IS NULL
RETURNING *;

-- DELETE: soft delete, không xóa cứng để tránh cascade bản dịch/media
UPDATE public.poi
SET deleted_at = now(), updated_at = now(), row_version = row_version + 1
WHERE id = 123 AND deleted_at IS NULL
RETURNING id, deleted_at;
```

### 4.5 `poi_translation` — nội dung theo ngôn ngữ

```sql
-- READ
SELECT t.*, p.code AS poi_code, l.name AS language_name
FROM public.poi_translation t
JOIN public.poi p ON p.id = t.poi_id
JOIN public.language l ON l.code = t.language_code
ORDER BY t.poi_id, t.language_code;

-- CREATE: poi_id và language_code phải tồn tại
INSERT INTO public.poi_translation
(poi_id, language_code, name, description, narration_text, content_version)
VALUES (123, 'vi', 'Tên tiếng Việt', 'Mô tả ngắn', 'Nội dung thuyết minh đầy đủ.', 1)
RETURNING id, poi_id, language_code;

-- UPDATE: tăng content_version khi narration_text thay đổi để audio cũ không còn khớp
UPDATE public.poi_translation
SET name = 'Tên mới',
    description = 'Mô tả đã cập nhật',
    narration_text = 'Nội dung thuyết minh đã cập nhật.',
    content_version = content_version + 1,
    updated_at = now()
WHERE id = 234
RETURNING *;

-- DELETE: có thể cascade xóa audio_asset và audio_generation_job
DELETE FROM public.poi_translation
WHERE id = 234
RETURNING id, poi_id, language_code;
```

### 4.6 `audio_asset` — metadata audio

```sql
-- READ
SELECT id, translation_id, content_version, storage_key, source, format,
       mime_type, size_bytes, sha256, status, tts_voice, created_at
FROM public.audio_asset
ORDER BY created_at DESC;

-- CREATE: chỉ khi file đã tồn tại ở storage và metadata/hash đã được xác minh
INSERT INTO public.audio_asset
(translation_id, content_version, storage_key, source, format, mime_type,
 size_bytes, sha256, status, original_filename)
VALUES (234, 1, 'poi/123/vi/audio-example.mp3', 'UPLOAD', 'mp3',
        'audio/mpeg', 1024, '<SHA256_FILE_HASH_64_HEX>', 'READY', 'audio-example.mp3')
RETURNING id, storage_key, status;

-- UPDATE metadata/status; không đổi storage_key nếu file chưa được di chuyển
UPDATE public.audio_asset
SET status = 'STALE'
WHERE id = 345
RETURNING id, status, storage_key;

-- DELETE: chỉ xóa metadata sau khi xác minh file và job tham chiếu liên quan
DELETE FROM public.audio_asset
WHERE id = 345
RETURNING id, storage_key;
```

### 4.7 `audio_generation_job` — tác vụ tạo audio/TTS

```sql
-- READ
SELECT id, translation_id, content_version, language_code, status, attempts,
       max_attempts, next_attempt_at, error_code, created_at, updated_at
FROM public.audio_generation_job
ORDER BY created_at DESC;

-- CREATE: mẫu phục vụ kiểm thử; content_hash phải khớp quy tắc ứng dụng
INSERT INTO public.audio_generation_job
(translation_id, content_version, content_hash, language_code, status)
VALUES (234, 1, '<CONTENT_HASH>', 'vi', 'QUEUED')
RETURNING id, status;

-- UPDATE trạng thái (không thay thế luồng worker khi chạy production)
UPDATE public.audio_generation_job
SET status = 'FAILED',
    error_code = 'MANUAL_REVIEW',
    error_message = 'Marked for manual review',
    updated_at = now(),
    finished_at = now()
WHERE id = 567
RETURNING id, status, error_code;

-- DELETE: ưu tiên giữ lịch sử tác vụ; chỉ xóa dữ liệu thử nghiệm đã xác minh
DELETE FROM public.audio_generation_job
WHERE id = 567 AND status IN ('SUCCEEDED', 'FAILED')
RETURNING id, status;
```

### 4.8 `poi_image` — ảnh của POI

```sql
-- READ
SELECT id, poi_id, storage_key, mime_type, sort_order, created_at
FROM public.poi_image
ORDER BY poi_id, sort_order, id;

-- CREATE: file ảnh phải có sẵn ở media storage
INSERT INTO public.poi_image (poi_id, storage_key, mime_type, sort_order)
VALUES (123, 'poi/123/images/example.jpg', 'image/jpeg', 1)
RETURNING id, poi_id, storage_key;

-- UPDATE thứ tự hiển thị
UPDATE public.poi_image
SET sort_order = 2
WHERE id = 678
RETURNING *;

-- DELETE metadata: xác minh chính xác ảnh và xử lý file storage riêng
DELETE FROM public.poi_image
WHERE id = 678
RETURNING id, poi_id, storage_key;
```

### 4.9 `access_package` — gói thời hạn truy cập

```sql
-- READ
SELECT * FROM public.access_package ORDER BY id;

-- CREATE
INSERT INTO public.access_package (code, name, duration_minutes, active)
VALUES ('DEMO_2H', 'Gói demo 2 giờ', 120, TRUE)
RETURNING *;

-- UPDATE
UPDATE public.access_package
SET name = 'Gói demo 3 giờ', duration_minutes = 180, active = TRUE
WHERE code = 'DEMO_2H'
RETURNING *;

-- DELETE: chỉ khi chưa có QR tham chiếu
DELETE FROM public.access_package p
WHERE p.code = 'DEMO_2H'
  AND NOT EXISTS (SELECT 1 FROM public.access_qr q WHERE q.package_id = p.id)
RETURNING p.id, p.code;
```

### 4.10 `access_qr` — QR truy cập

```sql
-- READ
SELECT id, package_id, status, note, issued_by, created_at, redeemed_at, revoked_at
FROM public.access_qr
ORDER BY created_at DESC;

-- CREATE: token_hash phải là SHA-256 của token QR được tạo bởi backend
INSERT INTO public.access_qr (token_hash, package_id, status, note, issued_by)
VALUES ('<SHA256_QR_TOKEN_HASH_64_HEX>', 1, 'ISSUED', 'QR tạo cho demo', 123)
RETURNING id, package_id, status;

-- UPDATE: ghi chú; không tự sửa status để giả lập redeem/revoke
UPDATE public.access_qr
SET note = 'Ghi chú đã cập nhật'
WHERE id = 789 AND status = 'ISSUED'
RETURNING id, note, status;

-- DELETE: chỉ xóa QR thử nghiệm chưa redeem; luồng production nên dùng revoke
DELETE FROM public.access_qr
WHERE id = 789 AND status = 'ISSUED'
  AND redeemed_at IS NULL
RETURNING id, status;
```

### 4.11 `access_grant` — quyền truy cập sau khi redeem QR

```sql
-- READ
SELECT id, qr_id, device_hash, created_at, expires_at, revoked_at
FROM public.access_grant
ORDER BY created_at DESC;

-- CREATE: chỉ dùng cho fixture kiểm thử; production phải redeem qua backend
INSERT INTO public.access_grant
(qr_id, token_hash, device_hash, expires_at)
VALUES (789, '<SHA256_GRANT_TOKEN_HASH_64_HEX>',
        '<SHA256_DEVICE_HASH_64_HEX>', now() + interval '24 hours')
RETURNING id, qr_id, expires_at;

-- UPDATE: thu hồi grant
UPDATE public.access_grant
SET revoked_at = now()
WHERE id = 890 AND revoked_at IS NULL
RETURNING id, revoked_at;

-- DELETE: xóa grant sẽ ảnh hưởng lịch sử usage_event theo FK cascade
DELETE FROM public.access_grant
WHERE id = 890
RETURNING id, qr_id;
```

### 4.12 `usage_event` — dữ liệu analytics

Các loại sự kiện được DB cho phép: `session_start`, `poi_view`, `audio_play`.

```sql
-- READ: đếm theo loại sự kiện
SELECT event_type, count(*) AS total
FROM public.usage_event
GROUP BY event_type
ORDER BY event_type;

-- READ: sự kiện theo khoảng thời gian (from inclusive, to exclusive)
SELECT id, event_type, grant_id, poi_id, event_id, occurred_at
FROM public.usage_event
WHERE occurred_at >= TIMESTAMPTZ '2026-10-01 00:00:00+00'
  AND occurred_at <  TIMESTAMPTZ '2026-11-01 00:00:00+00'
ORDER BY occurred_at DESC;

-- CREATE: mẫu kiểm thử; event_id phải duy nhất nếu khác NULL
INSERT INTO public.usage_event (event_type, grant_id, poi_id, event_id)
VALUES ('poi_view', 890, 123, 'test-event-unique-001')
RETURNING *;

-- UPDATE: không khuyến nghị sửa analytics raw event
UPDATE public.usage_event
SET poi_id = 124
WHERE id = 901
RETURNING *;

-- DELETE: không khuyến nghị; ứng dụng có thể có retention job riêng
-- Chỉ dùng sau khi đã xác minh chính xác các hàng và chính sách retention:
DELETE FROM public.usage_event
WHERE id = 901
RETURNING id, event_type, occurred_at;
```

### 4.13 `audit_log` — nhật ký kiểm toán

Bảng này nên được xem là append-only. Ví dụ `INSERT` chỉ để minh họa cấu trúc/fixture; production nên ghi qua backend để actor/action/result nhất quán.

```sql
-- READ
SELECT id, occurred_at, actor_id, actor_name, action, resource_type,
       resource_id, result, detail
FROM public.audit_log
ORDER BY occurred_at DESC
LIMIT 100;

-- CREATE: ví dụ fixture; detail chỉ chứa metadata an toàn, không có secret/token
INSERT INTO public.audit_log
(actor_id, actor_name, action, resource_type, resource_id, result, detail)
VALUES (123, 'admin_example', 'POI_UPDATE', 'POI', '123',
        'SUCCESS', 'Updated POI description')
RETURNING id, occurred_at, action, result;

-- UPDATE: KHÔNG khuyến nghị; audit log phải giữ nguyên lịch sử
-- UPDATE public.audit_log SET detail = '...' WHERE id = 1001;

-- DELETE: KHÔNG khuyến nghị; chỉ theo quy trình retention/tuân thủ được phê duyệt
-- DELETE FROM public.audit_log WHERE id = 1001;
```

### 4.14 `flyway_schema_history` — lịch sử migration

Bảng hệ thống của Flyway; chỉ đọc để kiểm tra migration.

```sql
-- READ
SELECT installed_rank, version, description, type, script, checksum,
       installed_by, installed_on, execution_time, success
FROM public.flyway_schema_history
ORDER BY installed_rank;

-- CREATE / UPDATE / DELETE
-- KHÔNG chạy SQL thủ công. Sửa schema bằng migration mới trong repository
-- rồi chạy Flyway theo quy trình triển khai.
```

## 5. Các truy vấn kiểm tra hữu ích

```sql
-- Số lượng bản ghi mỗi bảng nghiệp vụ
SELECT 'account' AS table_name, count(*) FROM public.account
UNION ALL SELECT 'language', count(*) FROM public.language
UNION ALL SELECT 'poi', count(*) FROM public.poi
UNION ALL SELECT 'poi_translation', count(*) FROM public.poi_translation
UNION ALL SELECT 'audio_asset', count(*) FROM public.audio_asset
UNION ALL SELECT 'audio_generation_job', count(*) FROM public.audio_generation_job
UNION ALL SELECT 'poi_image', count(*) FROM public.poi_image
UNION ALL SELECT 'access_package', count(*) FROM public.access_package
UNION ALL SELECT 'access_qr', count(*) FROM public.access_qr
UNION ALL SELECT 'access_grant', count(*) FROM public.access_grant
UNION ALL SELECT 'usage_event', count(*) FROM public.usage_event
UNION ALL SELECT 'audit_log', count(*) FROM public.audit_log
UNION ALL SELECT 'auth_session', count(*) FROM public.auth_session
ORDER BY table_name;

-- Kiểm tra các POI chưa soft-delete và bản dịch
SELECT p.id, p.code, p.default_name, p.status, t.language_code, t.name
FROM public.poi p
LEFT JOIN public.poi_translation t ON t.poi_id = p.id
WHERE p.deleted_at IS NULL
ORDER BY p.id, t.language_code;

-- Audio đang READY, đối chiếu version nội dung
SELECT a.id AS audio_id, a.storage_key, a.status AS audio_status,
       a.content_version AS audio_version,
       t.id AS translation_id, t.language_code, t.content_version AS current_version
FROM public.audio_asset a
JOIN public.poi_translation t ON t.id = a.translation_id
WHERE a.status = 'READY'
ORDER BY a.id;

-- QR theo trạng thái
SELECT status, count(*) AS total
FROM public.access_qr
GROUP BY status
ORDER BY status;
```

## 6. Chạy file SQL từ PowerShell

Ví dụ tạo file truy vấn chỉ đọc tại `scripts\inspect-db.sql`, sau đó:

```powershell
Set-Location 'D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-'
neon psql production -- -f .\scripts\inspect-db.sql
```

Nếu muốn xuất kết quả CSV, xem tùy chọn hỗ trợ của phiên bản CLI/psql đang cài đặt trước khi chạy.

## 7. Checklist trước khi ghi/xóa

- [ ] Đã xác minh branch, database và user bằng `SELECT current_database(), current_user;`
- [ ] Đã đọc đúng bản ghi bằng `SELECT ... WHERE id = ...;`
- [ ] Đã kiểm tra FK và nguy cơ cascade.
- [ ] Đang dùng ID/điều kiện cụ thể, không có lệnh cập nhật/xóa toàn bảng.
- [ ] Có transaction và biết cách `ROLLBACK`.
- [ ] Không sửa trực tiếp `flyway_schema_history`, token/hash, password hash hoặc audit/analytics history tùy tiện.
- [ ] Không ghi connection string / password / API key vào file Markdown, Git hoặc log.

## Tài liệu chính thức

- [Neon CLI](https://neon.com/cli)
- [Neon CLI — connection string](https://github.com/neondatabase/website/blob/main/content/docs/cli/connection-string.md)
- [Neon branches](https://github.com/neondatabase/website/blob/main/content/docs/manage/branches.md)
- [Neon roles](https://github.com/neondatabase/website/blob/main/content/docs/manage/roles.md)
