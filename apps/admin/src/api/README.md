# Admin API

Chứa API client và adapter giao tiếp backend cho Admin Web. Chuẩn hóa base URL, request/response và xử lý lỗi theo hợp đồng trong `docs/architecture/api.md`.

Không đặt fetch rải rác với error handling khác nhau trong từng page. Không lưu secret trong bundle. Khi endpoint đổi, cập nhật test và tài liệu API cùng PR.