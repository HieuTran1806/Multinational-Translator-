# Quy trình tự động GitHub Actions

Nhánh này giữ quy trình kiểm tra tài liệu/hợp đồng tại `.github/workflows/ci.yml`. Quy trình kiểm tra tài liệu nền tảng, lỗi khoảng trắng và chạy unit test backend bằng Maven Wrapper/Java 21. Integration test cần PostgreSQL vẫn chạy riêng qua `mvnw verify`; workflow không triển khai ứng dụng.

Áp dụng quyền tối thiểu, trigger đáng tin cậy, giới hạn thời gian, kiểm soát chạy đồng thời và quản lý bí mật an toàn. Cập nhật `docs/operations/ci-cd.md` mỗi khi workflow thay đổi. Các mẫu triển khai trong `docs/operations/cd-templates/` chỉ để tham khảo, hiện không hoạt động.
