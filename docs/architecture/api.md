# REST API `/api/v1`

> **Hợp đồng chuẩn cho giai đoạn xây dựng lại:** [phase-1-contract-baseline.md](./phase-1-contract-baseline.md) là nguồn tham chiếu cho quy ước chung, cấu trúc phản hồi lỗi, RBAC và nghiệp vụ Seller/thanh toán/QR. Các endpoint cũ hoặc được đánh dấu đề xuất trong tài liệu này không mặc nhiên được xem là điểm cuối API đã được triển khai.

> **Lưu ý phạm vi:** Tài liệu này phản ánh hợp đồng/hiện trạng API hiện có. Nghiệp vụ đích mới cần bổ sung giao dịch Seller, xác minh thanh toán, QR dùng một lần, quyền User có thời hạn và báo cáo Seller; các endpoint/cơ chế ngoại tuyến cũ không thuộc phạm vi nghiệp vụ chỉ hoạt động khi có mạng và cần được rà soát riêng.

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
- Tạm thời **Admin** tạo QR vì UC12 (Seller) ngoài MVP. URL trong QR cấu hình bằng `APP_ACCESS_ACTIVATION_URL`.

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

- `ADMIN`: quản lý POI/nội dung/đa phương tiện/âm thanh và tạo/quản lý Seller.
- `SUPER_ADMIN`: quản lý tài khoản Admin, RBAC và Audit Log; không có quyền quản lý POI hoặc Seller.
- Chỉ `SUPER_ADMIN` được xem Audit Log toàn hệ thống. Mọi quy tắc phải được thực thi tại backend, không chỉ ẩn giao diện.

> **RBAC đích đã chốt, đã thực thi một phần:** `SecurityConfig` giới hạn toàn bộ `/api/v1/admin/**` cho vai trò `ADMIN`, nên Super Admin bị từ chối (403) khi quản lý POI/nội dung/audio; kiểm thử `SecurityIT.superAdminCannotManagePoiContent` và `apps/admin/scripts/verify-e2e.mjs` xác minh lại. Các endpoint dành riêng cho Super Admin (quản lý Admin/RBAC/Audit Log) chưa được triển khai, nên hiện chưa có đường dẫn nào chỉ Super Admin truy cập được; khi bổ sung phải khai báo matcher riêng trước `/api/v1/admin/**`.

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

## Hợp đồng đích Seller/thanh toán/QR — chưa triển khai hoặc xác minh

> Phần này là đề xuất kiến trúc đích, không khẳng định endpoint đã tồn tại trong OpenAPI hoặc mã nguồn.

| Phương thức | Đường dẫn đề xuất | Hành vi |
|---|---|---|
| POST | `/seller/transactions` | Định hướng giai đoạn sau (UC12 ngoài MVP); gói lấy từ cấu hình/dữ liệu, không hard-code. |
| POST | `/seller/transactions/{id}/cancel` | Định hướng giai đoạn sau; chính sách hủy do Seller/chủ sản phẩm chốt khi UC12 được triển khai. |
| GET | `/seller/transactions/{id}` | Định hướng giai đoạn sau; kiểm tra quyền sở hữu ở backend, không lộ secret. |
| POST | `/payments/vnpay/return` | Điều hướng trình duyệt; không coi chuyển hướng trình duyệt là bằng chứng thanh toán. |
| POST | `/payments/vnpay/ipn` | Xác minh chữ ký, mã tham chiếu, số tiền/trạng thái; xử lý idempotent; sai lệch chuyển sang cần kiểm tra. |

`/public/access/redeem` và `/public/access/me` đã được triển khai (xem mục "Truy cập User bằng QR"). Khi làm UC12, Seller tạo QR qua `AccessQrAdminService` sau khi thanh toán được xác nhận, thay cho Admin.

### Quy tắc tích hợp VNPAY Sandbox

- Chỉ cấu hình endpoint và thông tin xác thực thương gia của môi trường sandbox; bí mật không được commit vào kho mã nguồn.
- Xác minh checksum/chữ ký theo tài liệu chính thức, đối chiếu mã đơn hàng, số tiền và trạng thái. Không tin tham số từ trình duyệt đơn thuần.
- Callback lặp/trễ phải idempotent; không tạo QR/grant trùng. Kiểm thử chữ ký sai, số tiền/mã sai, callback trễ/lặp và timeout.
- Chỉ phát QR sau khi backend xác nhận thanh toán. Grant và đánh dấu QR đã dùng phải được bảo vệ bằng giao dịch/ràng buộc dữ liệu để không thể cấp hai grant.
- UC12 ngoài MVP. Thiết kế gói phải mở rộng được; `DEMO_24H` (1 VND/24 giờ kể từ lúc kích hoạt thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau. Seller tạo/cấp QR riêng cho từng khách hàng sau khi thanh toán thành công; QR không tự hết hạn trước khi kích hoạt. UC12 và nghiệp vụ tạo QR nội bộ ngoài MVP.
- IPN có thể cần URL backend truy cập được từ Internet; `localhost` không tự nhận callback từ nhà cung cấp. Nếu dùng tunnel, chỉ dùng tunnel demo có kiểm soát.

### Bảo vệ quyền User

Tất cả API User yêu cầu quyền truy cập hợp lệ ở backend, ngoại trừ điểm cuối API tối thiểu cần thiết để xem/đổi QR và xử lý lỗi. QR riêng cho từng khách hàng, chỉ kích hoạt một lần; grant gắn với thiết bị đã kích hoạt. Phiên có thể được khôi phục trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị hoặc cấp lại grant sang thiết bị khác.

Đã thực thi trong `SecurityConfig`: `GET /api/v1/public/**` yêu cầu `ROLE_VISITOR`, chỉ trừ `/public/languages` và `POST /public/access/redeem`. Kiểm thử: `AccessFlowIT`, `AccessGrantServiceTest`. Các endpoint Seller/thanh toán ở bảng trên vẫn là hợp đồng đề xuất.
