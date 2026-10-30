# Code Control & Maintenance Cheatsheet — Multitional-Translator

> Mục tiêu: dùng khi giảng viên yêu cầu giải thích code, truy vết dữ liệu, sửa nhanh một logic, thao tác database hoặc chứng minh thay đổi không làm hỏng hệ thống.
>
> **Ưu tiên:** Analytics → Database/CRUD/FK → API/Service/Repository → POI/Translation/Audio → Authentication/RBAC → tests/config.
>
> Repository: `D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-`. Các đường dẫn dưới đây tương ứng với cấu trúc repository đã kiểm tra. Luôn mở code hiện tại trước khi trả lời vì code có thể thay đổi.

## 1. Bản đồ câu hỏi giảng viên có thể hỏi

| Mức | Câu hỏi dự đoán | Phải mở được |
|---|---|---|
| Rất cao | Analytics lấy dữ liệu từ đâu? | `UsageSummary.jsx`, `analyticsApi`, `AdminAnalyticsController`, `AnalyticsService`, `UsageEventRepository`, `UsageEventService` |
| Rất cao | Nhân đôi số liệu analytics ở đâu? | `AnalyticsService.systemSummary()`, `toTotals()`, `countDaily()`, `countViewsByPoi()` |
| Rất cao | Có bao nhiêu bảng? Quan hệ giữa bảng nào? | migrations V1–V6 và `information_schema` trên database thực |
| Rất cao | Thêm một dòng, sửa, xóa một dòng | Bảng đơn giản như `language` hoặc `poi`; hiểu constraint trước khi chạy |
| Rất cao | Vì sao xóa bị FK chặn? Khắc phục ra sao? | FK trong migrations, `ON DELETE`, thứ tự xóa bảng con trước bảng cha, soft delete |
| Cao | Request từ frontend đi đến database như thế nào? | `apps/admin/src/api/endpoints.js` → Controller → Service → Store/Repository |
| Cao | Sửa nội dung POI ở đâu? | `poi`, `poi_translation`, API POI và service tương ứng |
| Cao | Tại sao audio cũ không còn hợp lệ sau khi sửa lời thuyết minh? | `content_version`, `audio_asset.status`, TTS job |
| Cao | Vì sao user thường không gọi được API Admin? | `SecurityConfig`, role/authorization, controller mapping |
| Khá cao | Thêm validation hoặc xử lý lỗi ở đâu? | Request DTO, Service, `ApiException`, `ErrorCode` |
| Khá cao | Làm sao biết thay đổi không phá code? | Unit/integration tests, frontend tests, build/lint |
| Khá cao | Làm sao database thay đổi có kiểm soát? | Flyway migrations; không sửa `flyway_schema_history` bằng tay |

## 2. Analytics — truy vết từ giao diện đến database

### 2.1 Luồng dữ liệu cần giải thích

1. **User frontend** ghi nhận sự kiện sử dụng: `session_start`, `poi_view`, `audio_play`.
2. Frontend gửi request tới `POST /api/v1/public/usage-events`.
3. `PublicUsageEventController.record(...)` nhận request và chuyển cho `UsageEventService.record(...)`.
4. `UsageEventService` kiểm tra `eventType`, xử lý `eventId` chống ghi trùng, lấy `grantId` từ visitor đã xác thực rồi lưu event qua `UsageEventStore`.
5. Bảng `usage_event` lưu `event_type, grant_id, poi_id, event_id, occurred_at`.
6. Admin frontend gọi `GET /api/v1/admin/analytics/summary?from=...&to=...`.
7. `AdminAnalyticsController.summary(...)` gọi `AnalyticsService.systemSummary(from, to)`.
8. `UsageEventRepository` tổng hợp dữ liệu bằng `countTotals`, `countDaily`, `countViewsByPoi`; kết quả được trả về `UsageSummary.jsx` để hiển thị.

### 2.2 File cần mở nhanh

| File | Vai trò |
|---|---|
| `apps/admin/src/components/UsageSummary.jsx` | Hiển thị KPI, biểu đồ/bảng theo ngày, top POI; chọn khoảng thời gian |
| `apps/admin/src/api/endpoints.js` | Hàm `analyticsApi.summary({ from, to })`, URL API Admin |
| `services/backend/src/main/java/vn/edu/thuyetminh/analytics/AdminAnalyticsController.java` | Endpoint `GET /api/v1/admin/analytics/summary` |
| `.../analytics/AnalyticsService.java` | Hàm `systemSummary(from, to)`, tổng hợp dữ liệu, giới hạn top 10 POI |
| `.../analytics/UsageEventRepository.java` | Truy vấn đếm tổng, theo ngày, theo POI |
| `.../analytics/PublicUsageEventController.java` | API nhận sự kiện từ User |
| `.../analytics/UsageEventService.java` | Validate event, deduplicate, lưu event |
| `.../analytics/UsageEvent.java` | Entity ánh xạ bản ghi event |

### 2.3 Nếu giảng viên yêu cầu nhân đôi số liệu (x2)

Trước tiên hỏi lại hoặc xác định họ muốn nhân đôi **số hiển thị**, **mọi trường của API**, hay **dữ liệu thật trong DB**. Không cập nhật dữ liệu raw trong DB chỉ để tạo số x2.

**Cách A — x2 KPI totals ở backend**

File: `services/backend/src/main/java/vn/edu/thuyetminh/analytics/AnalyticsService.java`

Trong `toTotals(List<Object[]> rows)`, sau vòng lặp tạo map, có thể dùng:

```java
totals.replaceAll((eventType, count) -> count * 2);
```

Trong repository hiện tại, dòng này có thể đang được comment. Bỏ comment chỉ làm x2 `summary.totals`; **không** tự động nhân đôi daily chart hoặc top POI.

**Cách B — x2 toàn bộ các đầu ra analytics**

Trong `systemSummary(...)`, cần xử lý riêng:
- `totals`: map tổng theo event type.
- `daily`: từng `DailyCount.count` trong kết quả `usageEvents.countDaily(...)`.
- `topPois`: trường `views` của từng `PoiViews`.

Không chỉ sửa `totals` rồi tuyên bố toàn bộ dashboard đã x2. Nên tạo hàm chuyển đổi nhỏ, rõ ràng và test cho cả ba loại dữ liệu. Tránh sửa các câu SQL thành cách nhân đôi số hàng vì sẽ làm sai ngữ nghĩa truy vấn.

**Cách C — chỉ x2 số hiển thị ở Admin**

File: `apps/admin/src/components/UsageSummary.jsx`. Nhân giá trị tại lớp trình bày, ví dụ ở chỗ render KPI, daily hoặc top POI. API và database vẫn giữ số thật. Nếu đây là demo, cần ghi rõ dữ liệu đang được nhân hệ số để tránh trình bày như số liệu thực tế.

**Câu trả lời mẫu:** “Analytics không lấy số ngẫu nhiên từ một biến. User gửi event, backend xác thực và ghi vào `usage_event`; các query tổng hợp theo khoảng thời gian. Muốn x2 phải sửa đúng lớp dữ liệu cần tác động: totals, daily, top POI hoặc lớp hiển thị. Em không nhân đôi dữ liệu gốc trong production.”

### 2.4 Truy vấn kiểm tra số liệu trong database

```sql
SELECT event_type, COUNT(*) AS total
FROM public.usage_event
GROUP BY event_type
ORDER BY event_type;

SELECT date_trunc('day', occurred_at) AS day_utc,
       event_type,
       COUNT(*) AS total
FROM public.usage_event
WHERE occurred_at >= TIMESTAMPTZ '2026-10-01 00:00:00+00'
  AND occurred_at <  TIMESTAMPTZ '2026-11-01 00:00:00+00'
GROUP BY date_trunc('day', occurred_at), event_type
ORDER BY day_utc, event_type;

SELECT poi_id, COUNT(*) AS views
FROM public.usage_event
WHERE event_type = 'poi_view'
  AND poi_id IS NOT NULL
GROUP BY poi_id
ORDER BY views DESC
LIMIT 10;
```

Chú ý: khoảng thời gian dùng `from <= occurred_at < to` (đầu bao gồm, cuối không bao gồm); mặc định service lấy khoảng 30 ngày nếu không truyền ngày. Event có `eventId` trùng sẽ được bỏ qua để tránh retry ghi nhiều lần.

## 3. Database — đếm bảng và quan hệ

### 3.1 Đếm bảng nào là con số chính xác?

Schema được mô tả trong migrations V1–V6 có **13 bảng nghiệp vụ**:

1. `account`
2. `auth_session`
3. `language`
4. `poi`
5. `poi_translation`
6. `audio_asset`
7. `audio_generation_job`
8. `poi_image`
9. `access_package`
10. `access_qr`
11. `access_grant`
12. `audit_log`
13. `usage_event`

Nếu database đã chạy Flyway, thường có thêm `flyway_schema_history`, nên có thể thấy **14 bảng trong schema public**. Hãy chạy truy vấn dưới đây để trả lời theo database thực tế, không chỉ dựa vào file migration:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

### 3.2 Các quan hệ FK quan trọng

- `auth_session.account_id → account.id` — `ON DELETE CASCADE`.
- `poi_translation.poi_id → poi.id` — `ON DELETE CASCADE`.
- `poi_translation.language_code → language.code` — ngăn xóa ngôn ngữ còn được dùng.
- `audio_asset.translation_id → poi_translation.id` — `ON DELETE CASCADE`.
- `audio_generation_job.translation_id → poi_translation.id` — `ON DELETE CASCADE`.
- `audio_generation_job.audio_asset_id → audio_asset.id` — `ON DELETE SET NULL`.
- `poi_image.poi_id → poi.id` — `ON DELETE CASCADE`.
- `access_qr.package_id → access_package.id` — mặc định ngăn xóa package đang được tham chiếu.
- `access_grant.qr_id → access_qr.id` — `ON DELETE CASCADE`.
- `usage_event.grant_id → access_grant.id` — `ON DELETE CASCADE`.
- `usage_event.poi_id → poi.id` — `ON DELETE SET NULL`.
- `audio_generation_job.requested_by → account.id`, `issued_by → account.id` — `ON DELETE SET NULL` theo migration.

Để xác nhận toàn bộ FK từ database đang kết nối:

```sql
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.constraint_schema = tc.constraint_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
ORDER BY parent_table, child_table;
```

### 3.3 Thêm một dòng — ví dụ bảng `language`

Chọn bảng tham chiếu ít hơn để demo CRUD. Kiểm tra trước khi insert:

```sql
SELECT * FROM public.language WHERE code = 'fr';

BEGIN;
INSERT INTO public.language
  (code, name, native_name, tts_language_code, enabled, sort_order)
VALUES
  ('fr', 'French', 'Français', 'fr-FR', TRUE, 3)
RETURNING *;

-- Nếu đã xác nhận kết quả:
COMMIT;
-- Nếu dữ liệu không đúng, thay COMMIT bằng ROLLBACK.
```

Nếu code `fr` đã tồn tại hoặc bị bảng khác tham chiếu, không ép insert lần nữa. Hãy chọn code chưa tồn tại và xác minh các FK trước khi xóa.

### 3.4 Xóa một dòng an toàn

```sql
-- 1) Xem chính xác bản ghi
SELECT * FROM public.language WHERE code = 'fr';

-- 2) Kiểm tra bảng con có tham chiếu ngôn ngữ này không
SELECT * FROM public.poi_translation WHERE language_code = 'fr';
SELECT * FROM public.audio_generation_job WHERE language_code = 'fr';

-- 3) Chỉ xóa nếu không có tham chiếu
BEGIN;
DELETE FROM public.language
WHERE code = 'fr'
  AND NOT EXISTS (
    SELECT 1 FROM public.poi_translation
    WHERE language_code = 'fr'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.audio_generation_job
    WHERE language_code = 'fr'
  )
RETURNING *;

-- COMMIT nếu kết quả đúng; nếu không, ROLLBACK.
```

### 3.5 Nếu không xóa được do khóa ngoại

Giải thích được bốn phương án, chọn theo nghiệp vụ chứ không chọn tùy tiện:

1. **Xóa bản ghi con trước** — chỉ khi dữ liệu con không còn cần thiết. Ví dụ translation có thể có audio và TTS job phụ thuộc; phải kiểm tra chuỗi quan hệ trước.
2. **Dùng `ON DELETE CASCADE`** — chỉ khi xóa cha đồng nghĩa hợp lý với xóa con. Cascade được khai báo trong migration; không tự đổi FK production để né lỗi.
3. **Dùng `ON DELETE SET NULL`** — chỉ khi cột FK cho phép NULL và bản ghi con có thể tồn tại độc lập. Ví dụ usage event giữ lịch sử nhưng `poi_id` thành NULL khi POI bị xóa cứng.
4. **Soft delete / disable** — phù hợp khi cần giữ lịch sử hoặc audit. Ví dụ `poi.deleted_at = now()`, `account.deleted_at = now()`, hoặc đặt `enabled = false`.

Không nên tắt `session_replication_role`, drop constraint hoặc dùng `CASCADE` trong câu DELETE chỉ để xóa được dòng; có thể làm mất cả dữ liệu liên quan.

### 3.6 Xem bản ghi con trước khi xóa POI

```sql
SELECT * FROM public.poi WHERE id = 123;
SELECT * FROM public.poi_translation WHERE poi_id = 123;
SELECT * FROM public.poi_image WHERE poi_id = 123;
SELECT a.*
FROM public.audio_asset a
JOIN public.poi_translation t ON t.id = a.translation_id
WHERE t.poi_id = 123;
SELECT j.*
FROM public.audio_generation_job j
JOIN public.poi_translation t ON t.id = j.translation_id
WHERE t.poi_id = 123;
```

POI hiện có `deleted_at`, vì vậy xóa mềm thường phù hợp hơn xóa cứng. API `DELETE` cũng có thể được triển khai dưới dạng soft delete; cần mở service thực tế để xác nhận hành vi thay vì suy luận từ HTTP method.

## 4. Frontend → API → Controller → Service → Repository

Ví dụ với API POI trong Admin:

1. Giao diện gọi hàm trong `apps/admin/src/api/endpoints.js`, ví dụ `poiApi.create(data)`.
2. `apps/admin/src/api/client.js` chịu trách nhiệm gửi HTTP request, header xác thực và xử lý response/error.
3. Controller trong backend nhận route, parse request và trả HTTP response.
4. Service xử lý quy tắc nghiệp vụ và validation.
5. Repository/Store đọc ghi database.
6. Entity/DTO ánh xạ dữ liệu giữa DB và API.

Khi được hỏi “muốn sửa chức năng này thì sửa ở đâu?”, trước tiên tìm route/API, sau đó lần ngược vào service/repository. Không đưa logic nghiệp vụ vào React component hoặc Controller nếu service là nơi phù hợp hơn.

### API nên nhớ

| Nghiệp vụ | Endpoint trong frontend API client |
|---|---|
| Đăng nhập | `POST /api/v1/auth/login` |
| Danh sách POI | `GET /api/v1/admin/pois` |
| Tạo POI | `POST /api/v1/admin/pois` |
| Sửa POI | `PUT /api/v1/admin/pois/{id}` |
| Xóa POI | `DELETE /api/v1/admin/pois/{id}` |
| Upload audio | `POST /api/v1/admin/pois/{id}/translations/{lang}/audio` |
| Tạo TTS | `POST /api/v1/admin/pois/{id}/translations/{lang}/tts` |
| Tạo QR | `POST /api/v1/admin/access-qrs` |
| Thu hồi QR | `POST /api/v1/admin/access-qrs/{id}/revoke` |
| Analytics | `GET /api/v1/admin/analytics/summary` |
| Audit log | `GET /api/v1/admin/audit` |

Đây là mapping trong frontend client; quyền truy cập cuối cùng phải kiểm tra trong cấu hình security và backend controller/service.

## 5. POI, bản dịch và audio — câu hỏi maintain có thể gặp

### 5.1 Thêm một POI cần gì?

- `poi.code` duy nhất, đúng định dạng uppercase/digit/underscore/hyphen.
- `latitude` trong [-90, 90], `longitude` trong [-180, 180].
- `status` là `DRAFT` hoặc `PUBLISHED`.
- Nếu thêm nội dung đa ngôn ngữ, `poi_translation.poi_id` phải tồn tại, `language_code` phải tồn tại và cặp (`poi_id`, `language_code`) không được trùng.
- Nội dung `narration_text` không được rỗng.

### 5.2 Vì sao sửa narration có thể làm audio cũ không hợp lệ?

- `poi_translation.content_version` biểu diễn phiên bản nội dung.
- `audio_asset.content_version` ghi phiên bản lời thuyết minh mà audio được tạo từ đó.
- Khi narration thay đổi, phiên bản nội dung cần tăng và audio cũ có thể chuyển thành `STALE` hoặc không còn được chọn phát.
- TTS dùng `audio_generation_job`; xem `status`, `attempts`, `error_code`, `error_message` khi sinh audio thất bại.

### 5.3 Vì sao upload audio thành công nhưng user vẫn lỗi?

Kiểm tra theo thứ tự:
1. API upload trả status gì và metadata đã được ghi vào `audio_asset` chưa?
2. `storage_key` có trỏ tới file thực tế trên media storage (Cloudflare R2) không?
3. `status = READY` và `content_version` khớp bản dịch hiện tại chưa?
4. MIME type/format, quyền truy cập media và API URL có đúng không?
5. User frontend gọi đúng endpoint và gửi đúng auth/grant chưa?
6. Browser console và backend logs có lỗi 401/403/404/5xx không?

Database chỉ lưu metadata audio; file bytes ở storage. Xóa/sửa row không tự di chuyển hoặc xóa file storage.

## 6. Authentication và phân quyền

Các câu hỏi có thể gặp:
- Token/session được lưu thế nào? Database lưu hash của token, không phải token rõ.
- Khi session hết hạn hoặc bị revoke thì sao?
- Vì sao endpoint Admin không cho User gọi?
- Khác biệt giữa `ADMIN` và `SUPER_ADMIN` ở đâu?
- Backend có kiểm tra quyền hay chỉ ẩn nút ở frontend?

File cần tìm:
- `services/backend/src/main/java/vn/edu/thuyetminh/auth/`
- `services/backend/src/main/java/vn/edu/thuyetminh/access/`
- `services/backend/src/main/java/vn/edu/thuyetminh/rbac/`
- Cấu hình `SecurityConfig` (tìm theo tên class trong backend).
- `apps/admin/src/auth/` và `apps/admin/src/api/client.js`.

Câu trả lời nên nhấn mạnh: ẩn UI không phải là bảo mật; backend phải xác thực và phân quyền cho endpoint. Password phải được lưu dạng hash (BCrypt), không lưu plaintext.

## 7. Validation, lỗi và bảo trì code

Giảng viên có thể yêu cầu:
- Chặn tọa độ ngoài phạm vi hợp lệ.
- Chặn code POI trùng.
- Trả lỗi 400 khi khoảng thời gian Analytics sai.
- Xử lý file upload sai định dạng/quá lớn.
- Ngăn User truy cập API Admin.
- Xử lý dữ liệu không tồn tại (404), không đủ quyền (403), chưa xác thực (401).

Khi thêm validation:
1. Kiểm tra format/required ở DTO hoặc request boundary.
2. Kiểm tra quy tắc nghiệp vụ trong Service.
3. Dùng constraint database làm lớp bảo vệ cuối cùng.
4. Chuyển lỗi thành response nhất quán bằng cơ chế exception hiện có.
5. Thêm test cho cả trường hợp hợp lệ và không hợp lệ.

## 8. Test và chứng minh thay đổi

Trước khi demo một thay đổi:
- [ ] Chỉ ra file và hàm đã sửa.
- [ ] Giải thích input → xử lý → output.
- [ ] Chạy test liên quan.
- [ ] Chạy test suite/build khi phù hợp.
- [ ] Kiểm tra UI/API và database thực tế nếu thay đổi liên quan dữ liệu.
- [ ] Cho biết rủi ro và cách rollback.

Các lệnh tham khảo (chạy từ thư mục tương ứng):

```powershell
# Backend: từ services/backend
.\mvnw.cmd test

# Admin frontend: từ apps/admin
npm test
npm run lint
npm run build

# User frontend: từ apps/web
npm test
npm run lint
npm run build
```

Nếu scripts trong `package.json` khác với ví dụ, kiểm tra `package.json` trước khi chạy.

## 9. Git và database migrations

- `git status --short`: xem staged, unstaged, untracked.
- `git diff`: xem nội dung thay đổi chưa stage.
- `git diff --staged`: xem thay đổi đã stage.
- `git log --oneline -n 10`: xem lịch sử commit gần đây.
- Schema thay đổi phải được mô tả bằng migration Flyway mới trong `services/backend/src/main/resources/db/migration/`.
- Không sửa migration đã áp dụng trên production nếu điều đó làm lệch lịch sử; thông thường tạo migration phiên bản tiếp theo.
- Không sửa trực tiếp `flyway_schema_history`.
- Không đưa `.env.local`, connection string, password, API keys hoặc token vào Git.

## 10. Bài tập tự kiểm tra trước buổi bảo vệ

Có thể luyện theo thứ tự sau:

1. Mở `AnalyticsService.java`, chỉ ra chỗ tạo `totals`, `daily`, `topPois`; giải thích mỗi phần đến từ query nào.
2. Mô phỏng x2 KPI và nói rõ vì sao chart/top POI không tự x2.
3. Chạy query đếm bảng trên database hiện tại; phân biệt bảng nghiệp vụ và bảng Flyway.
4. Thêm một ngôn ngữ demo vào branch test, đọc lại bằng SELECT, sau đó rollback hoặc xóa nếu không có FK tham chiếu.
5. Cố ý chọn ngôn ngữ đang được tham chiếu và giải thích lỗi FK; đưa ra phương án an toàn thay vì tắt constraint.
6. Tìm endpoint tạo POI từ frontend tới Controller/Service/Repository.
7. Chỉ ra cách backend bảo vệ endpoint Admin.
8. Giải thích quan hệ narration version và audio asset status.
9. Thêm một test cho validation mới và chạy test.
10. Nêu quy trình rollback code và database an toàn.

## 11. Nguyên tắc khi trả lời giảng viên

- Không chỉ đọc tên hàm; nói được dữ liệu đầu vào, xử lý chính, đầu ra và nơi lưu.
- Không đoán tên biến hoặc số dòng. Mở file hiện tại và tìm method/identifier.
- Không sửa production để minh họa CRUD nếu có thể dùng branch thử nghiệm.
- Không xóa cha trước khi hiểu cascade và dữ liệu con.
- Phân biệt **số liệu thật trong database**, **số liệu tổng hợp ở API**, và **số được nhân hệ số để demo**.
- Khi được yêu cầu sửa tại chỗ: thay đổi nhỏ nhất có thể, test ngay, giải thích tác động và cách hoàn tác.

