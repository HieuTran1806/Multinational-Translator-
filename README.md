# Multitional-Translator — Nền tảng hợp đồng

Nhánh nền hợp đồng Giai đoạn 1. Backend cũ đã được khôi phục riêng tại `services/backend/` để chuẩn hóa dần; các phần triển khai khác vẫn không có trên nhánh này. Bản gốc vẫn được giữ trên nhánh `XuanHoai_UC01-03`.

## Nội dung kho mã

- `services/backend/` — backend Spring Boot được khôi phục từ nhánh gốc; đang được chuẩn hóa theo các ranh giới SOLID/Clean Architecture.
- `docs/requirements/` — yêu cầu nghiệp vụ và các ca sử dụng.
- `docs/architecture/` — kiến trúc, hợp đồng API, cấu trúc dự án và nền tảng Giai đoạn 1.
- `docs/development/` — tiêu chuẩn phát triển và kiểm thử.
- `docs/planning/` — danh sách công việc, kế hoạch và giả định.
- `docs/reports/` — báo cáo kiểm chứng và kiểm kê hiện trạng.
- `docs/integrations/` — tài liệu tham khảo tích hợp được giữ lại.
- `docs/operations/` — CI/CD, triển khai và các mẫu CD chưa hoạt động.
- `LICENSE`, `.gitignore`, `.editorconfig`, `.nvmrc` — giấy phép và các tệp hỗ trợ kho mã.

Các phần `apps/`, `infra/`, `design-system/` và `scripts/` vẫn chưa được khôi phục. Backend hiện tại chưa triển khai Seller/payment/QR; không xem các luồng này là đã có chỉ vì chúng xuất hiện trong tài liệu.

## Tài liệu Giai đoạn 1

- [Yêu cầu nghiệp vụ](docs/requirements/BRD.md)
- [Đặc tả ca sử dụng](docs/requirements/Use_Case_Specification_Final_15_UC.md)
- [Kiến trúc](docs/architecture/architecture.md)
- [Tài liệu API](docs/architecture/api.md)
- [Kiểm kê và quyết định hợp đồng Giai đoạn 1](docs/architecture/phase-1-contract-baseline.md)
- [Kiểm kê hiện trạng](docs/reports/current-state-inventory.md)
- [Kiến trúc backend và quy tắc phụ thuộc](services/backend/ARCHITECTURE.md)
- [CI/CD](docs/operations/ci-cd.md)

## Hoạt động CI

Workflow CI kiểm tra tài liệu nền tảng, lỗi khoảng trắng và chạy unit test backend bằng Java 21/Maven Wrapper. Backend cũng có thể được kiểm tra cục bộ bằng `services/backend/mvnw.cmd clean test`. Không workflow nào trên nhánh này triển khai lên môi trường production.
