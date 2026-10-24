# Cấu trúc dự án — nền tảng Giai đoạn 1

Nhánh hiện tại chứa tài liệu và backend cũ đã được khôi phục tại `services/backend/`. Các phần ứng dụng di động, frontend Admin, hạ tầng và design system vẫn chưa được khôi phục. Nhánh gốc `XuanHoai_UC01-03` vẫn giữ lịch sử triển khai đầy đủ trước đó.

Các phần hiện có và còn thiếu:

- Ứng dụng di động User: chưa khôi phục trên nhánh này.
- `services/backend/`: Spring Boot REST API, PostgreSQL/Flyway, media storage và TTS; đang được tái cấu trúc theo từng bước.
- Ứng dụng web Admin: chưa khôi phục trên nhánh này.
- Luồng Seller/thanh toán/QR: chưa có controller/model triển khai trong backend cũ.
- Hạ tầng và môi trường phát triển cục bộ: chưa khôi phục ngoài cấu hình riêng của backend.
- Design token dùng chung: chưa khôi phục trên nhánh này.

Quy tắc backend được ghi trong [`services/backend/ARCHITECTURE.md`](../../services/backend/ARCHITECTURE.md). Đây là bước chuẩn hóa chuyển tiếp, chưa phải Clean Architecture thuần: application services còn dùng Spring transaction và Spring Data repositories; entity còn là JPA entity.
