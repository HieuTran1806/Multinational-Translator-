# Tích hợp liên tục và triển khai liên tục (CI/CD)

## Tích hợp liên tục (CI) — `.github/workflows/ci.yml`

Nhánh này được chủ động duy trì như nền tảng tài liệu/hợp đồng. Workflow CI chạy khi tạo/cập nhật pull request và khi push lên `main`; workflow xác thực các tài liệu hợp đồng bắt buộc và kiểm tra lỗi khoảng trắng bằng `git diff --check`. Workflow **không** dựng hoặc triển khai ứng dụng vì các thư mục mã nguồn đã được loại bỏ khỏi nhánh này.

Khi xây dựng lại mã nguồn, chỉ bổ sung các tác vụ riêng cho backend, Admin, mobile và kiểm thử tích hợp sau khi đã có thư mục mã nguồn cùng lệnh kiểm thử tương ứng. Áp dụng quyền tối thiểu, cố định phiên bản action, đặt giới hạn thời gian và kiểm soát chạy đồng thời, không đưa bí mật production vào CI, và tuyệt đối không triển khai production từ pull request không đáng tin cậy.

## CD — chưa hoạt động

Các mẫu trong `cd-templates/` chỉ để tham khảo, không phải workflow GitHub đang hoạt động. Phải tiếp tục vô hiệu hóa triển khai production cho đến khi cấu hình lưu trữ, bí mật, môi trường, phê duyệt và bảo vệ nhánh được thiết lập có chủ đích và xác minh đầy đủ.

## Bảo vệ nhánh

Sau khi workflow chạy thành công ít nhất một lần, hãy cấu hình bảo vệ nhánh/bộ quy tắc cho `main`: bắt buộc pull request, yêu cầu kiểm tra CI tương ứng, chặn force push và hạn chế xóa nhánh. Cập nhật tên kiểm tra trạng thái bắt buộc mỗi khi workflow thay đổi.
