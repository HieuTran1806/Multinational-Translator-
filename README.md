# Multitional-Translator — Nền tảng hợp đồng

Bản nền kho mã sau khi làm sạch cho Giai đoạn 1. Bản triển khai trước được giữ trên nhánh Git gốc; nhánh này giữ tài liệu dự án, cấu hình CI/CD và hợp đồng chung để xây dựng lại hệ thống nhất quán.

## Nội dung kho mã

- `.github/workflows/ci.yml` — CI kiểm tra tài liệu và hợp đồng nền tảng; không dựng hoặc triển khai các thành phần ứng dụng.
- `docs/requirements/` — yêu cầu nghiệp vụ và các ca sử dụng.
- `docs/architecture/` — kiến trúc, hợp đồng API, cấu trúc dự án và nền tảng Giai đoạn 1.
- `docs/development/` — tiêu chuẩn phát triển và kiểm thử dùng làm tài liệu tham khảo khi xây dựng lại.
- `docs/planning/` — danh sách công việc, kế hoạch và giả định.
- `docs/reports/` — báo cáo kiểm chứng và kiểm kê hiện trạng.
- `docs/integrations/` — tài liệu tham khảo tích hợp được giữ lại.
- `docs/operations/` — CI/CD, triển khai và các mẫu CD chưa hoạt động.
- `LICENSE`, `.gitignore`, `.editorconfig`, `.nvmrc` — giấy phép và các tệp hỗ trợ kho mã.

Các thư mục mã nguồn triển khai (`apps/`, `services/`, `infra/`, `design-system/` và `scripts/`) đã được chủ động loại bỏ khỏi nhánh này. Không xem bản triển khai trước là nguồn chuẩn hiện tại; hãy sử dụng hợp đồng và yêu cầu đã được thông qua trước khi xây dựng lại.

## Tài liệu Giai đoạn 1

- [Yêu cầu nghiệp vụ](docs/requirements/BRD.md)
- [Đặc tả ca sử dụng](docs/requirements/Use_Case_Specification_Final_15_UC.md)
- [Kiến trúc](docs/architecture/architecture.md)
- [Tài liệu API](docs/architecture/api.md)
- [Kiểm kê và quyết định hợp đồng Giai đoạn 1](docs/architecture/phase-1-contract-baseline.md)
- [Kiểm kê hiện trạng](docs/reports/current-state-inventory.md)
- [CI/CD](docs/operations/ci-cd.md)

## Hoạt động CI

Workflow kiểm tra các tài liệu nền tảng bắt buộc và lỗi khoảng trắng trong bản vá. Các tác vụ dựng/kiểm thử ứng dụng được chủ động bỏ qua cho đến khi mã nguồn được tạo lại và các tác vụ tương ứng được bổ sung có chủ đích. Không workflow nào trên nhánh này triển khai lên môi trường production.
