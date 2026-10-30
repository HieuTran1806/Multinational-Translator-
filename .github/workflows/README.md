# GitHub Actions

Repository hiện có workflow CI tại .github/workflows/ci.yml.

Workflow chạy:
- Kiểm tra các tài liệu chuẩn README.md và docs/USE_CASES.md, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/DEVELOPMENT.md.
- Kiểm tra whitespace của patch.
- Backend unit tests bằng Maven Wrapper và Java 21.
- Web Admin lint, Vitest và production build bằng Node.js 22.
- Web User lint, Vitest và production build bằng Node.js 22.

Workflow không chạy backend integration tests vì cần PostgreSQL test riêng; không deploy ứng dụng. Không có workflow CD hoạt động trong .github/workflows tại thời điểm audit. Mẫu CD trong docs cũ không được coi là quy trình triển khai hiện hành. Cập nhật tài liệu Development khi workflow thay đổi.
