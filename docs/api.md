# REST API `/api/v1`

OpenAPI: `GET /v3/api-docs`, Swagger UI: `/swagger-ui.html` (bật ở dev; tắt ở prod trừ khi `APP_API_DOCS_ENABLED=true`).

URL media trong response là **đường dẫn tương đối** (ví dụ `/api/v1/public/audio/12`); client tự ghép với base URL.

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
| 409 | `CONFLICT` (trùng mã, optimistic lock), `PUBLISH_NOT_READY` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA` |
| 502 | `EXTERNAL_SERVICE_ERROR` (dự phòng; lỗi Google TTS được ghi vào job: `errorCode`, `errorMessage`) |
| 503 | `TTS_NOT_CONFIGURED` |
| 500 | `INTERNAL_ERROR` (không lộ stack trace) |

## Phân trang

Query `page` (từ 0), `size` (1..100). Response: `{ items, page, size, totalItems, totalPages }`.

## Xác thực

| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/login` | `{username, password}` → `{accessToken, tokenType, expiresAt, account}` |
| POST | `/auth/logout` | Thu hồi token hiện tại → 204 |
| GET | `/auth/me` | Thông tin tài khoản |

## Public (khách, không đăng nhập)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/public/languages` | Ngôn ngữ đang bật |
| GET | `/public/pois?page&size&lang` | POI công khai |
| GET | `/public/pois/{id}?lang=en` | Chi tiết theo ngôn ngữ + `audio` hiện hành (hoặc `null`); `fallback=true` nếu thiếu ngôn ngữ yêu cầu |
| GET | `/public/pois/{id}/offline-manifest` | Nội dung mọi ngôn ngữ + audio (`sha256`, `sizeBytes`, `contentVersion`) + `manifestVersion` |
| GET | `/public/audio/{assetId}` | Stream audio hiện hành của POI công khai (hỗ trợ Range) |
| GET | `/public/pois/{id}/image` | Ảnh đại diện |

## Admin (Bearer token, vai trò ADMIN/SUPER_ADMIN)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/pois?page&size&status&q` | Danh sách mọi trạng thái, kèm trạng thái nội dung/audio từng ngôn ngữ |
| POST | `/admin/pois` | Tạo POI (nháp) → 201 |
| GET | `/admin/pois/{id}` | Chi tiết, nội dung, audio hiện hành, job TTS gần nhất |
| PUT | `/admin/pois/{id}` | Sửa (gửi `rowVersion` để phát hiện ghi đè → 409) |
| POST | `/admin/pois/{id}/publish` | Công khai (cần ≥ 1 ngôn ngữ có nội dung) |
| POST | `/admin/pois/{id}/unpublish` | Về nháp |
| PUT | `/admin/pois/{id}/translations/{lang}` | Lưu nội dung; đổi `narrationText` → `contentVersion+1`, audio cũ `STALE` |
| POST | `/admin/pois/{id}/translations/{lang}/audio` | multipart `file` (MP3/M4A/WAV/OGG, ≤ 20 MB, kiểm tra magic bytes) → 201 |
| POST | `/admin/pois/{id}/translations/{lang}/tts` | 202 job mới / job đang chạy; 200 nếu đã có audio cùng nội dung; 503 nếu chưa cấu hình |
| GET | `/admin/tts/jobs/{jobId}` | Trạng thái job (polling) |
| GET | `/admin/tts/status` | `{configured, provider, maxInputBytes}` |
| POST | `/admin/pois/{id}/image` | multipart `file` (JPEG/PNG/WEBP ≤ 5 MB) |
| GET | `/admin/audio/{assetId}`, `/admin/pois/{id}/image` | Nghe thử / xem ảnh (mọi trạng thái) |
| GET | `/admin/languages` | Ngôn ngữ |

## Health

`GET /actuator/health` (+ `/liveness`, `/readiness`) — public, không lộ chi tiết.
