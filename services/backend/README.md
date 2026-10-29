# Backend — Spring Boot, Java 21, Maven Wrapper

Backend có hai vai trò vận hành trong kiến trúc mặc định: Render phục vụ Web User production; một tiến trình Spring Boot local dùng riêng cho Web Admin và kết nối Neon qua profile `local-neon`.

## Chạy backend local cho Web Admin

Từ thư mục gốc, đặt `DATABASE_URL` (URI `postgresql://...` của Neon) trong file `.env.local` đã được Git ignore, rồi chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-local-neon.ps1
```

Script tự chuyển URI sang JDBC, ép SSL và khởi động profile `local-neon` tại cổng `18081`. Không in thông tin xác thực. Profile chỉ dùng `db/migration`, không nạp demo seed và fail-fast nếu thiếu `DB_*`; không tự chuyển sang database local.

- Health: <http://localhost:18081/actuator/health>
- OpenAPI: chỉ bật khi được cấu hình rõ ràng.
- Admin frontend: `http://localhost:5173`, `VITE_API_BASE_URL=http://localhost:18081`.

Mọi thao tác ghi của tiến trình local đi thẳng tới Neon branch được cấu hình. Không dùng branch production cho integration test hoặc thao tác phá huỷ.

## Kiểm tra chất lượng

```powershell
.\mvnw.cmd clean test
```

Unit test không cần database. `mvnw verify` chạy thêm integration tests và cần database kiểm thử riêng được cấu hình qua `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`. Tuyệt đối không dùng Neon production cho test.

## Cấu hình

- `application.yml`: cấu hình chung.
- `application-local-neon.yml`: cấu hình chạy local cho Admin.
- `application-prod.yml`: cấu hình backend production trên Render.
- `src/main/resources/db/migration`: Flyway migrations.
- `src/main/resources/db/demo`: dữ liệu demo chỉ phục vụ môi trường phát triển/test phù hợp; không được nạp vào profile `local-neon` hoặc `prod`.

Không commit secrets; không ghi credentials vào log. Xem [hướng dẫn chạy chung](../../README.md), [kiến trúc backend](ARCHITECTURE.md) và [triển khai](../../docs/operations/deployment.md).
