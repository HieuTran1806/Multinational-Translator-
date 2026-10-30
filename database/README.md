# Database — Multitional Translator

## 1. Phạm vi và nguồn dữ liệu

Thư mục này chứa snapshot schema hiện hành và bộ dữ liệu demo có thể khôi phục độc lập:

- `schema.sql`: schema PostgreSQL cuối cùng, đối chiếu trực tiếp Neon branch `production` và Flyway V1–V6.
- `demo-data.sql`: dữ liệu demo đã khử thông tin nhạy cảm, dựa trên nội dung POI/translation production và dữ liệu synthetic cho tài khoản, QR, grant, audit, analytics.

Neon `production` chỉ là nguồn audit và tham chiếu dữ liệu. Không chạy file SQL trong thư mục này trên production. Không sao chép account/password hash, auth session, QR token, grant token, object-storage key hoặc credentials production.

Schema lịch sử vẫn được quản lý bởi Flyway tại `services/backend/src/main/resources/db/migration`. Không sửa migration đã phát hành. `schema.sql` là snapshot để khôi phục nhanh, không thay thế lịch sử migration.

## 2. PostgreSQL và Flyway

- Đã audit trên PostgreSQL 18.6.
- Khuyến nghị PostgreSQL 15 trở lên.
- Schema sử dụng identity columns, partial indexes, CHECK constraints và foreign keys.
- Flyway hiện có V1–V6; production đã xác nhận cả 6 migration thành công.
- JPA dùng `ddl-auto=validate`; Hibernate không tự tạo hoặc cập nhật schema.

`schema.sql` không tạo `flyway_schema_history`. Sau khi restore snapshot version 6, phải baseline Flyway ở version 6 trước khi chạy backend. Xem mục 10.

## 3. Danh sách 13 bảng nghiệp vụ

| Bảng | Mục đích |
|---|---|
| `account` | Tài khoản ADMIN/SUPER_ADMIN, soft delete |
| `auth_session` | Session bearer của Admin, chỉ lưu token hash |
| `language` | Ngôn ngữ và cấu hình TTS |
| `poi` | Điểm tham quan, tọa độ, trạng thái và metadata ảnh bìa |
| `poi_translation` | Nội dung POI theo ngôn ngữ |
| `poi_image` | Metadata ảnh POI |
| `audio_asset` | Metadata audio upload/TTS |
| `audio_generation_job` | Hàng đợi sinh audio |
| `access_package` | Gói thời hạn truy cập |
| `access_qr` | QR token dùng một lần |
| `access_grant` | Quyền truy cập sau khi redeem QR, gắn thiết bị |
| `audit_log` | Lịch sử sự kiện quản trị/nghiệp vụ |
| `usage_event` | Sự kiện sử dụng cho Analytics |

Không có bảng Seller, Payment, Order hoặc RBAC động trong schema hiện hành. `flyway_schema_history` là bảng quản lý migration, không phải bảng nghiệp vụ.

## 4. Quan hệ chính

- `account` 1—N `auth_session`; `account` cũng là người tạo QR/job và có thể tham chiếu chính nó qua `deleted_by`.
- `poi` 1—N `poi_translation`; `poi` 1—N `poi_image`.
- `language` 1—N `poi_translation` và `audio_generation_job`.
- `poi_translation` 1—N `audio_asset` và `audio_generation_job`.
- `access_package` 1—N `access_qr`; `access_qr` 1—0..1 `access_grant`.
- `access_grant` 1—N `usage_event`; `usage_event.poi_id` nullable.
- `audit_log.actor_id` là historical identifier, không có FK để giữ audit trail khi tài khoản bị xóa.

## 5. Khởi tạo database rỗng

Tạo một database local hoặc database/branch kiểm thử riêng. Đặt connection string vào biến môi trường, không ghi vào file SQL hoặc Git.

PowerShell:

```powershell
$env:DEMO_DATABASE_URL = "postgresql://<user>:<password>@<host>/<database>?sslmode=require"
psql "$env:DEMO_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
psql "$env:DEMO_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/demo-data.sql
```

Hai file chạy theo đúng thứ tự trên. Mỗi file tự quản lý transaction; nếu câu lệnh lỗi, transaction của file đó được rollback. Không chạy trên production.

## 6. Dữ liệu demo và số lượng kỳ vọng

Sau khi chạy cả hai file SQL, trước khi khởi động backend:

| Bảng | Số bản ghi |
|---|---:|
| account | 2 |
| auth_session | 0 |
| language | 2 |
| poi | 8 |
| poi_translation | 16 |
| poi_image | 1 |
| audio_asset | 0 |
| audio_generation_job | 1 |
| access_package | 1 |
| access_qr | 3 |
| access_grant | 1 |
| audit_log | 5 |
| usage_event | 5 |

Tất cả POI là dữ liệu demo lấy từ nội dung POI/translation production đã chọn lọc; không copy account production hoặc thông tin đăng nhập. Một POI ở trạng thái PUBLISHED để kiểm thử luồng User; các POI còn lại ở DRAFT để kiểm thử quyền xem/quản lý của Admin.

### Tài khoản demo

| Username | Role | Password |
|---|---|---|
| `superadmin` | `SUPER_ADMIN` | `MT-Demo-2026!Admin` |
| `admin` | `ADMIN` | `MT-Demo-2026!Admin` |

Cả hai mật khẩu được hash bằng BCrypt cost 12. Mật khẩu này chỉ dành cho database local/kiểm thử; không dùng cho môi trường công khai. Đổi mật khẩu trước khi dùng một môi trường có truy cập Internet.

### QR demo

Token được sinh bằng cùng quy tắc với ứng dụng: 32 byte ngẫu nhiên, Base64URL không padding. Database chỉ lưu SHA-256 hex.

| Nhãn | Token | Trạng thái |
|---|---|---|
| QR-1 | `6KCDkzmia8aeqnMc4jGOORGibxhr4ExMTjiTYnUvOR0` | ISSUED — có thể redeem |
| QR-2 | `1KFMj-_U5kYYfCP4Qurr5bxOpgpKYiCkCcBOSqnfvNo` | ISSUED — có thể redeem |
| QR-3 | `q43oOY0GurNiEBrE2Z6s2VZ7XnKw26-KtZ_N0JhT5Fk` | REDEEMED — grant mẫu đã tồn tại |

QR-1 và QR-2 mỗi token chỉ redeem một lần. QR-3 đã được redeem để có sẵn dữ liệu Access Grant và Analytics:

- Demo grant bearer token: `ae9ooRl19EqUTCbZQ0FBdfA9G3XAv2g4Z7NT368lpDk`
- Device ID: `demo-device-mt-2026`

Các token trên là thông tin công khai của bộ demo, không liên quan đến production. Không tái sử dụng chúng ngoài local/kiểm thử.

### Media demo

SQL tạo metadata ảnh `images/demo-placeholder.png`. Backend profile `dev` có `DemoMediaSeeder` tạo file PNG 1×1 này nếu chưa tồn tại. `DemoAudioSeeder` đính kèm hai WAV fixture có sẵn trong source vào bản dịch của POI demo đang PUBLISHED. Vì media bytes nằm trong storage, SQL không chứa file nhị phân và không copy object-storage key production.

Sau khi backend dev khởi động, số `audio_asset` dự kiến tăng từ 0 lên 2. `audio_generation_job` có một bản ghi FAILED mẫu, không gọi nhà cung cấp TTS.

## 7. Reset database demo

Chỉ reset database local/kiểm thử:

1. Dừng backend đang kết nối database đó.
2. Xóa và tạo lại database rỗng bằng công cụ quản trị PostgreSQL/Neon.
3. Chạy lại `schema.sql`.
4. Chạy lại `demo-data.sql`.
5. Khởi động backend theo hướng dẫn Flyway ở mục 10.

Không dùng `DROP SCHEMA ... CASCADE` hoặc reset database trên production. Không dùng `ON CONFLICT DO NOTHING` để che lỗi dữ liệu demo; bộ seed được thiết kế cho database rỗng.

## 8. Kiểm tra dữ liệu và khóa ngoại

Các truy vấn kiểm tra nhanh:

```sql
SELECT 'account' AS table_name, count(*) FROM account
UNION ALL SELECT 'poi', count(*) FROM poi
UNION ALL SELECT 'poi_translation', count(*) FROM poi_translation
UNION ALL SELECT 'poi_image', count(*) FROM poi_image
UNION ALL SELECT 'audio_asset', count(*) FROM audio_asset
UNION ALL SELECT 'access_qr', count(*) FROM access_qr
UNION ALL SELECT 'access_grant', count(*) FROM access_grant
UNION ALL SELECT 'audit_log', count(*) FROM audit_log
UNION ALL SELECT 'usage_event', count(*) FROM usage_event;

SELECT p.code, count(t.id) AS translations
FROM poi p LEFT JOIN poi_translation t ON t.poi_id = p.id
GROUP BY p.id, p.code ORDER BY p.id;

SELECT q.id, q.status, count(g.id) AS grants
FROM access_qr q LEFT JOIN access_grant g ON g.qr_id = q.id
GROUP BY q.id, q.status ORDER BY q.id;
```

Kiểm tra orphan records:

```sql
SELECT count(*) AS orphan_translations
FROM poi_translation t LEFT JOIN poi p ON p.id=t.poi_id WHERE p.id IS NULL;

SELECT count(*) AS orphan_grants
FROM access_grant g LEFT JOIN access_qr q ON q.id=g.qr_id WHERE q.id IS NULL;

SELECT count(*) AS orphan_usage_events
FROM usage_event e LEFT JOIN access_grant g ON g.id=e.grant_id WHERE g.id IS NULL;
```

Mỗi truy vấn orphan phải trả về 0.

## 9. Chạy Flyway trên database tạo từ snapshot

Không chạy lại V1–V6 trên snapshot vì schema đã ở trạng thái sau V6. Không bật `baseline-on-migrate` mặc định cho mọi môi trường.

Khi khởi động backend lần đầu trên database đã restore bằng `schema.sql`, cấu hình baseline tạm thời:

```powershell
$env:SPRING_FLYWAY_BASELINE_ON_MIGRATE = "true"
$env:SPRING_FLYWAY_BASELINE_VERSION = "6"
$env:SPRING_FLYWAY_LOCATIONS = "classpath:db/migration"
$env:SPRING_PROFILES_ACTIVE = "dev"
```

Cấu hình `SPRING_FLYWAY_LOCATIONS` chỉ dùng migration schema chính, không nạp các demo migration cũ V100–V102. Profile `dev` vẫn bật các media seeder. Chạy backend, xác minh `flyway_schema_history` có baseline version 6 và Hibernate `ddl-auto=validate` khởi động không lỗi.

Giữ `SPRING_FLYWAY_LOCATIONS=classpath:db/migration` cho database snapshot này. Sau khi baseline thành công có thể bỏ hai biến baseline; không xóa Flyway history. Các migration schema mới từ V7 trở đi sẽ được Flyway áp dụng bình thường.

Với database hoàn toàn rỗng và không chạy `schema.sql`, không baseline; để Flyway chạy V1–V6 bình thường. Sau đó có thể nạp `demo-data.sql` và bật profile dev cùng migration location `classpath:db/migration`.

## 10. Bảo mật và vận hành

- Không commit `.env`, connection string, password production, API key hoặc object-storage credentials.
- Không copy password hash, auth session, QR token, grant token hay dữ liệu account production.
- Không bật demo seed trên production.
- Không dùng tài khoản/token demo ở môi trường công khai.
- PostgreSQL lưu metadata media; bytes nằm trong MediaStorage. Backup database và object storage cần được quản lý nhất quán.
- Audit Log là append-only ở API, nhưng không phải cơ chế chống sửa đổi tuyệt đối trước tài khoản SQL có quyền ghi.
- Production chỉ được thay đổi schema qua migration mới đã review và có phương án khôi phục.
