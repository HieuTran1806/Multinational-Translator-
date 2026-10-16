# infra/

Chứa cấu hình và script hạ tầng phục vụ phát triển/chạy hệ thống: PostgreSQL, fixtures, scripts và Docker Compose.

- `.env.example` chỉ mô tả tên biến và giá trị mẫu không nhạy cảm.
- `docker-compose.yml` định nghĩa dịch vụ môi trường theo cấu hình hiện tại.
- Không commit file `.env` chứa secret hoặc dữ liệu production.
- Mọi thay đổi hạ tầng cần cập nhật hướng dẫn chạy và kiểm tra tương thích môi trường.