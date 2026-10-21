# Quy trình tự động GitHub Actions

Nhánh này giữ quy trình kiểm tra tài liệu/hợp đồng tại `.github/workflows/ci.yml`. Quy trình chỉ kiểm tra các tài liệu nền tảng bắt buộc và lỗi khoảng trắng; không có tác vụ dựng ứng dụng hoặc triển khai khi các thư mục mã nguồn chưa tồn tại.

Khi xây dựng lại các thành phần ứng dụng, hãy bổ sung tác vụ kiểm thử/dựng sau khi xác nhận thư mục mã nguồn và lệnh thực thi. Áp dụng quyền tối thiểu, trigger đáng tin cậy, giới hạn thời gian, kiểm soát chạy đồng thời và quản lý bí mật an toàn. Cập nhật `docs/operations/ci-cd.md` mỗi khi workflow thay đổi. Các mẫu triển khai trong `docs/operations/cd-templates/` chỉ để tham khảo, hiện không hoạt động.
