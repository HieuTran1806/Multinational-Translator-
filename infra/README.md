# Môi trường Docker local

Docker Compose cung cấp PostgreSQL và backend Spring Boot cho phát triển local. Admin web chạy riêng bằng Vite.

## Yêu cầu

- Docker Desktop và Docker Compose v2+
- Cổng 5432 và 8080 chưa bị sử dụng (hoặc đổi trong `.env`)
- Kết nối Internet lần đầu để tải image và Maven dependencies

## Khởi động

Chạy trong PowerShell từ thư mục gốc repository:

```powershell
if (-not (Test-Path infra/.env)) { Copy-Item infra/.env.example infra/.env }
notepad infra/.env
# Đổi POSTGRES_PASSWORD thành mật khẩu riêng cho môi trường local.
docker compose --env-file infra/.env -f infra/docker-compose.yml config
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
docker compose --env-file infra/.env -f infra/docker-compose.yml ps
```

Backend: http://localhost:8080$2
Health: http://localhost:8080/actuator/health$2
Readiness: http://localhost:8080/actuator/health/readiness

Profile `dev` chạy Flyway migrations và nạp dữ liệu demo. Để chạy Admin, xem [README gốc](../README.md#3-khởi-động-admin-web).

## Nhật ký và dừng

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml logs --tail 200 backend postgres
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

Lệnh `down` thông thường giữ named volumes. Không thêm `-v` nếu chưa chủ động muốn xóa database và media local.

## Lưu ý

- `infra/.env` chỉ dành cho local và không được commit.
- Nếu cần tạo Admin đầu tiên, chỉ bật `APP_BOOTSTRAP_ADMIN_ENABLED` với username/password local trong lúc khởi tạo, sau đó tắt lại.
- TTS Google cần credentials được cấu hình riêng; mặc định `APP_TTS_PROVIDER=none`.
- Đây không phải cấu hình production. Production cần secrets riêng, HTTPS, database có backup và nơi lưu media bền vững.
