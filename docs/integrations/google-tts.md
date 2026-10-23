# Google Cloud Text-to-Speech (chỉ dùng ở backend)

**Trạng thái:** mã tích hợp đã viết theo client Java chính thức (`com.google.cloud:google-cloud-texttospeech`, quản lý phiên bản qua `libraries-bom 26.84.0`) nhưng **chưa được gọi thử với Google thật** (không có thông tin xác thực trong môi trường phát triển). Kiểm thử tự động sử dụng bộ cung cấp dịch vụ giả lập.

## Cấu hình

1. Google Cloud Console → tạo/chọn dự án → bật **Cloud Text-to-Speech API** → bật tính năng thanh toán (TTS có hạn mức miễn phí nhưng vẫn cần bật thanh toán).
2. Tạo **service account** riêng cho backend, chỉ cấp các quyền cần thiết (TTS không cần role IAM đặc biệt ngoài việc project bật API; tránh cấp Owner/Editor).
3. Tạo tệp khóa JSON, lưu **ngoài kho mã nguồn** (ví dụ `~/secrets/gcp-tts.json`). Tệp này đã bị `.gitignore` chặn theo mẫu `gcp-*.json`, nhưng tốt nhất đừng đặt trong thư mục dự án.
4. Cấu hình backend:

```bash
APP_TTS_PROVIDER=google
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/gcp-tts.json   # Application Default Credentials
```

Docker Compose: bỏ chú thích ở dòng mount trong `infra/docker-compose.yml` và đặt `GOOGLE_CREDENTIALS_FILE_ON_HOST` trong `infra/.env`. Render: dùng **Secret Files** và trỏ `GOOGLE_APPLICATION_CREDENTIALS` tới `/etc/secrets/<tên file>`. Trên GCP (Cloud Run/GCE) nên dùng service account gắn vào dịch vụ thay vì tệp khóa.

Khi khởi động, backend ghi log `Application Default Credentials found` hoặc cảnh báo "chưa cấu hình" (không in đường dẫn hay nội dung credential). Kiểm tra: `GET /api/v1/admin/tts/status`.

## Giọng đọc

`language.tts_language_code` (`vi-VN`, `en-US`) và `language.default_tts_voice` (NULL = để Google chọn giọng mặc định). Đổi giọng bằng migration mới, ví dụ:

```sql
UPDATE language SET default_tts_voice = 'vi-VN-Standard-A' WHERE code = 'vi';
```

Đổi giọng làm `content_hash` thay đổi → lần yêu cầu sau sẽ tạo âm thanh mới.

## Cách hoạt động

- Thời gian chờ tối đa cho mỗi lần gọi: `APP_TTS_REQUEST_TIMEOUT` (30s); số lần thử lại: `APP_TTS_MAX_ATTEMPTS` (3), chỉ thử lại lỗi tạm thời.
- Giới hạn văn bản: `APP_TTS_MAX_INPUT_BYTES` (4500 byte UTF-8; tiếng Việt có dấu tốn 2–3 byte/ký tự). Nội dung dài hơn → `400 TTS_TEXT_TOO_LONG`; hãy rút gọn hoặc tải lên tệp âm thanh thu sẵn. (Chia đoạn và ghép MP3 nằm trong danh sách công việc tồn đọng.)
- Không tạo lại khi văn bản + ngôn ngữ + giọng không đổi.
- Google TTS **không dịch thuật**: mỗi ngôn ngữ được nhập nội dung thủ công.
- Không có thông tin xác thực: backend vẫn chạy; tải âm thanh lên vẫn hoạt động; yêu cầu TTS trả `503 TTS_NOT_CONFIGURED`.
