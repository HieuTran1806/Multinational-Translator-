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

## API công khai (khách không đăng nhập)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/public/languages` | Ngôn ngữ đang bật |
| GET | `/public/pois?page&size&lang` | POI công khai |
| GET | `/public/pois/{id}?lang=en` | Chi tiết theo ngôn ngữ + `audio` hiện hành (hoặc `null`); `fallback=true` nếu thiếu ngôn ngữ yêu cầu |
| GET | `/public/pois/{id}/offline-manifest` | Nội dung mọi ngôn ngữ + audio (`sha256`, `sizeBytes`, `contentVersion`) + `manifestVersion` |
| GET | `/public/audio/{assetId}` | Stream âm thanh hiện hành của POI công khai (hỗ trợ Range) |
| GET | `/public/pois/{id}/image` | Ảnh đại diện |

## API quản trị (Bearer token)

- `ADMIN`: quản lý POI/nội dung/đa phương tiện/âm thanh và tạo/quản lý Seller.
- `SUPER_ADMIN`: quản lý tài khoản Admin, RBAC và Audit Log; không có quyền quản lý POI hoặc Seller.
- Chỉ `SUPER_ADMIN` được xem Audit Log toàn hệ thống. Mọi quy tắc phải được thực thi tại backend, không chỉ ẩn giao diện.

> **RBAC đích đã chốt, chưa được xác minh là thực thi đầy đủ trong mã nguồn:** Admin quản lý POI/nội dung/audio và Seller; Super Admin không được truy cập chức năng quản lý POI hoặc Seller, chỉ quản lý Admin/RBAC và xem Audit Log. Tài liệu API hiện tại mô tả một số đường dẫn dùng chung `ADMIN/SUPER_ADMIN`; phải kiểm tra/cập nhật SecurityConfig và kiểm thử theo vai trò trước khi coi quy tắc này đã được thực thi.

## API quản trị (Bearer token, vai trò ADMIN/SUPER_ADMIN)

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
| POST | `/public/access/redeem` | Định hướng giai đoạn sau khi tích hợp tạo/cấp QR; QR do Seller cấp sau khi thanh toán thành công, chỉ kích hoạt một lần; không tự hết hạn trước khi kích hoạt nhưng có thể bị thu hồi; quyền truy cập có hiệu lực 24 giờ kể từ khi kích hoạt thành công, gắn với thiết bị đã kích hoạt. |
| GET | `/public/access/me` | Kiểm tra grant hiện tại và thời hạn ở backend. |

### Quy tắc tích hợp VNPAY Sandbox

- Chỉ cấu hình endpoint và thông tin xác thực thương gia của môi trường sandbox; bí mật không được commit vào kho mã nguồn.
- Xác minh checksum/chữ ký theo tài liệu chính thức, đối chiếu mã đơn hàng, số tiền và trạng thái. Không tin tham số từ trình duyệt đơn thuần.
- Callback lặp/trễ phải idempotent; không tạo QR/grant trùng. Kiểm thử chữ ký sai, số tiền/mã sai, callback trễ/lặp và timeout.
- Chỉ phát QR sau khi backend xác nhận thanh toán. Grant và đánh dấu QR đã dùng phải được bảo vệ bằng giao dịch/ràng buộc dữ liệu để không thể cấp hai grant.
- UC12 ngoài MVP. Thiết kế gói phải mở rộng được; `DEMO_24H` (1 VND/24 giờ kể từ lúc kích hoạt thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau. Seller tạo/cấp QR riêng cho từng khách hàng sau khi thanh toán thành công; QR không tự hết hạn trước khi kích hoạt. UC12 và nghiệp vụ tạo QR nội bộ ngoài MVP.
- IPN có thể cần URL backend truy cập được từ Internet; `localhost` không tự nhận callback từ nhà cung cấp. Nếu dùng tunnel, chỉ dùng tunnel demo có kiểm soát.

### Bảo vệ quyền User

Tất cả API User yêu cầu quyền truy cập hợp lệ ở backend, ngoại trừ điểm cuối API tối thiểu cần thiết để xem/đổi QR và xử lý lỗi. QR riêng cho từng khách hàng, chỉ kích hoạt một lần; grant gắn với thiết bị đã kích hoạt. Phiên có thể được khôi phục trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị hoặc cấp lại grant sang thiết bị khác.

Các endpoint ở bảng trên là hợp đồng đề xuất; cần đối chiếu bộ điều khiển, SecurityConfig, migration/schema và kiểm thử tích hợp trước khi công bố là khả dụng. API hiện tại cho phép truy cập công khai cần được rà soát theo điều kiện grant mới.
