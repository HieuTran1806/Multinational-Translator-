# infra/

Chứa cấu hình và script hạ tầng phục vụ phát triển/chạy hệ thống: PostgreSQL, fixtures, scripts và Docker Compose.

- `.env.example` chỉ mô tả tên biến và giá trị mẫu không nhạy cảm.
- `docker-compose.yml` chạy PostgreSQL, Spring Boot backend và web Admin React/Vite được phục vụ bởi Nginx.
- `infra/.env.example` là mẫu cấu hình; sao chép thành `infra/.env`, đặt `POSTGRES_PASSWORD` riêng trước khi khởi động.
- Chạy từ thư mục gốc repository: `docker compose -f infra/docker-compose.yml --env-file infra/.env up --build`.
- Web Admin: `http://localhost:5173`; backend: `http://localhost:8080`; PostgreSQL: `localhost:5432` (chỉ bind loopback).
- Không commit file `.env` chứa secret hoặc dữ liệu production.
- Mọi thay đổi hạ tầng cần cập nhật hướng dẫn chạy và kiểm tra tương thích môi trường.