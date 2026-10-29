# REST API `/api/v1`

> **Ma trận quyền hiện hành:** [Kế hoạch chuẩn hóa ma trận quyền và loại bỏ Seller](../planning/role-matrix-seller-removal-plan.md). Analytics chỉ cho ADMIN; tài khoản Admin và Audit Log chỉ cho SUPER_ADMIN; các API nghiệp vụ `/api/v1/admin/**` chỉ cho ADMIN; Seller endpoints đã bị loại bỏ. API matrix dưới đây phản ánh code hiện hành; không có endpoint Seller.



OpenAPI: `GET /v3/api-docs`, giao diện Swagger: `/swagger-ui.html` (bật trong môi trường phát triển; tắt trong production trừ khi `APP_API_DOCS_ENABLED=true`).

URL đa phương tiện trong phản hồi là **đường dẫn tương đối** (ví dụ `/api/v1/public/audio/12`); ứng dụng client tự ghép với URL gốc.

## Lỗi thống nhất

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Dữ liệu không hợp lệ",
  "status": 400,
  "path": "/api/v1/admin/pois",
  "timestamp": "2026-10-13T03:00:00Z",
  "fieldErrors": [{ "field": "latitude", "message": "Vĩ độ phải trong khoảng -90..90" }]
}
```

| HTTP | `code` |
|---|---|
| 400 | `VALIDATION_FAILED`, `BAD_REQUEST`, `TTS_TEXT_TOO_LONG` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` (kể cả POI nháp khi khách truy cập) |
| 409 | `CONFLICT` (trùng mã, khóa lạc quan), `PUBLISH_NOT_READY` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA` |
| 502 | `EXTERNAL_SERVICE_ERROR` (dự phòng; lỗi Google TTS được ghi vào job: `errorCode`, `errorMessage`) |
| 503 | `TTS_NOT_CONFIGURED` |
| 500 | `INTERNAL_ERROR` (không lộ stack trace) |

## Phân trang

Tham số truy vấn `page` (bắt đầu từ 0), `size` (1..100). Phản hồi: `{ items, page, size, totalItems, totalPages }`.

## Xác thực

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/auth/login` | `{username, password}` → `{accessToken, tokenType, expiresAt, account}` |
| POST | `/auth/logout` | Thu hồi token hiện tại → 204 |
| GET | `/auth/me` | Thông tin tài khoản |

## Truy cập User bằng QR (UC02, đã triển khai)

User không có tài khoản. User quét QR dùng một lần → nhận grant có thời hạn gắn với thiết bị → gửi kèm mọi request API User:

```
Authorization: Bearer <accessToken từ /public/access/redeem>
X-Device-Id: <mã thiết bị ngẫu nhiên do app tự sinh một lần, 16–128 ký tự [A-Za-z0-9_-]>
```

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| POST | `/public/access/redeem` | mở | `{qrToken, deviceId}` → `{accessToken, tokenType, expiresAt, packageCode}`. 400 `ACCESS_QR_INVALID` (sai/giả/bị thu hồi), 409 `ACCESS_QR_ALREADY_USED` |
| GET | `/public/access/me` | grant | `{grantId, packageCode, expiresAt, remainingSeconds}` — app gọi khi mở lại để khôi phục phiên (A1) |
| POST | `/admin/access-qrs` | ADMIN | `{packageCode?, note?}` → 201, có `qrToken` + `activationUrl` **chỉ trả đúng lần này** |
| GET | `/admin/access-qrs?page&size&status` | ADMIN | Danh sách QR, mới nhất trước (không có token) |
| POST | `/admin/access-qrs/{id}/revoke` | ADMIN | Thu hồi; nếu QR đã đổi thì grant tương ứng cũng hết hiệu lực |

- Đổi QR là nguyên tử (`UPDATE ... WHERE status='ISSUED'` + `UNIQUE(access_grant.qr_id)`): nhiều thiết bị đổi cùng lúc chỉ một thành công.
- Thời hạn grant lấy từ bảng `access_package` (`DEMO_24H` = 1440 phút), tính từ lúc đổi thành công.
- DB chỉ lưu SHA-256 của token QR, token grant và mã thiết bị; không log token.
- **Admin** tạo và quản lý QR truy cập theo UC12 hiện hành. URL trong QR cấu hình bằng `APP_ACCESS_ACTIVATION_URL`.

## API User (cần grant UC02, trừ `/public/languages`)

`<audio>`/`<img>` không gửi được header: app User phải tải media bằng `fetch` kèm header rồi dùng object URL (như `fetchMediaObjectUrl` của Admin). Thiếu/sai grant → 401 `ACCESS_REQUIRED`.

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/public/languages` | Ngôn ngữ đang bật (**không** cần grant, dùng cho màn hình quét QR) |
| GET | `/public/pois?page&size&lang` | POI công khai |
| GET | `/public/pois/{id}?lang=en` | Chi tiết theo ngôn ngữ + `audio` hiện hành (hoặc `null`); `fallback=true` nếu thiếu ngôn ngữ yêu cầu |
| GET | `/public/pois/{id}/offline-manifest` | Nội dung mọi ngôn ngữ + audio (`sha256`, `sizeBytes`, `contentVersion`) + `manifestVersion` |
| GET | `/public/audio/{assetId}` | Stream âm thanh hiện hành của POI công khai (hỗ trợ Range) |
| GET | `/public/pois/{id}/image` | Ảnh đại diện |

## API quản trị (Bearer token)

- `ADMIN`: quản lý POI, bản dịch, media, QR và Analytics toàn hệ thống.
- `SUPER_ADMIN`: quản lý tài khoản Admin và đọc Audit Log; không có quyền gọi API nghiệp vụ Admin hoặc Analytics.
- Chỉ `SUPER_ADMIN` được xem Audit Log toàn hệ thống. Mọi quy tắc phải được thực thi tại backend, không chỉ ẩn giao diện.

> **RBAC hiện hành:** `/api/v1/admin/accounts/**` và `/api/v1/admin/audit/**` chỉ `SUPER_ADMIN`; `/api/v1/admin/analytics/**` chỉ `ADMIN`; phần còn lại của `/api/v1/admin/**` chỉ `ADMIN`. Các matcher cụ thể đứng trước matcher tổng quát; mọi route không được khai báo bị từ chối.

### Quản lý tài khoản Admin (UC10 — chỉ `SUPER_ADMIN`)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/admin/accounts?page&size&q` | Danh sách tài khoản `ADMIN` đang hoạt động (không trả về hash mật khẩu), mới nhất trước |
| POST | `/admin/accounts` | Tạo tài khoản `{username, password, displayName?}` → 201; trùng username → 409; role được backend cố định thành `ADMIN` |
| PUT | `/admin/accounts/{id}` | Cập nhật `{displayName?, enabled?}`; target phải là tài khoản `ADMIN` |
| GET | `/admin/accounts/{id}` | Chi tiết một tài khoản Admin; target khác role ADMIN trả 404 |
| DELETE | `/admin/accounts/{id}` | Xóa mềm Admin, vô hiệu hóa đăng nhập và giữ lịch sử |
| POST | `/admin/accounts/{id}/reset-password` | Đặt lại mật khẩu `{newPassword}`; chỉ lưu hash BCrypt, không ghi mật khẩu vào audit log |

- Role vẫn là mô hình tĩnh `ADMIN`/`SUPER_ADMIN`; RBAC động (UC11) chưa triển khai.
- Mọi thao tác ghi audit `ADMIN_CREATE`/`ADMIN_UPDATE`/`ADMIN_RESET_PASSWORD` và chỉ Super Admin đọc được các bản ghi này qua `GET /admin/audit`.

## API quản trị (Bearer token, vai trò ADMIN)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/admin/pois?page&size&status&q` | Danh sách mọi trạng thái, kèm trạng thái nội dung/audio từng ngôn ngữ |
| POST | `/admin/pois` | Tạo POI (nháp) → 201 |
| GET | `/admin/pois/{id}` | Chi tiết, nội dung, âm thanh hiện hành, tác vụ TTS gần nhất |
| PUT | `/admin/pois/{id}` | Sửa (gửi `rowVersion` để phát hiện ghi đè → 409) |
| POST | `/admin/pois/{id}/publish` | Công khai theo đích nghiệp vụ: yêu cầu nội dung tiếng Anh hợp lệ và audio tiếng Anh hiện hành khớp phiên bản nội dung; xác minh mã nguồn trước khi coi là đã hỗ trợ |
| POST | `/admin/pois/{id}/unpublish` | Về nháp |
| PUT | `/admin/pois/{id}/translations/{lang}` | Lưu nội dung; đổi `narrationText` → `contentVersion+1`, âm thanh cũ `STALE` |
| POST | `/admin/pois/{id}/translations/{lang}/audio` | tệp multipart `file` (MP3/M4A/WAV/OGG, ≤ 20 MB, kiểm tra magic bytes) → 201 |
| POST | `/admin/pois/{id}/translations/{lang}/tts` | 202 tác vụ mới / tác vụ đang chạy; 200 nếu đã có âm thanh cùng nội dung; 503 nếu chưa cấu hình |
| GET | `/admin/tts/jobs/{jobId}` | Trạng thái job (polling) |
| GET | `/admin/tts/status` | `{configured, provider, maxInputBytes}` |
| POST | `/admin/pois/{id}/image` | tệp multipart `file` (JPEG/PNG/WEBP ≤ 5 MB) |
| GET | `/admin/audio/{assetId}`, `/admin/pois/{id}/image` | Nghe thử / xem hình ảnh (mọi trạng thái) |
| GET | `/admin/languages` | Ngôn ngữ |

## Kiểm tra tình trạng dịch vụ

`GET /actuator/health` (+ `/liveness`, `/readiness`) — public, không lộ chi tiết.

## Seller và thanh toán đã loại khỏi phạm vi

Không có API Seller, giao dịch hoặc tích hợp thanh toán. UC12 chỉ bao gồm quản lý QR Admin hiện có; việc kích hoạt QR và cấp grant User tuân theo các endpoint public đã mô tả ở trên.

### Bảo vệ quyền User

Tất cả API User yêu cầu quyền truy cập hợp lệ ở backend, ngoại trừ điểm cuối API tối thiểu cần thiết để xem/đổi QR và xử lý lỗi. QR riêng cho từng khách hàng, chỉ kích hoạt một lần; grant gắn với thiết bị đã kích hoạt. Phiên có thể được khôi phục trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị hoặc cấp lại grant sang thiết bị khác.

Đã thực thi trong `SecurityConfig`: `GET /api/v1/public/**` yêu cầu `ROLE_VISITOR`, chỉ trừ `/public/languages` và `POST /public/access/redeem`. Kiểm thử: `AccessFlowIT`, `AccessGrantServiceTest`. Không có endpoint Seller/thanh toán trong hợp đồng hiện hành.
