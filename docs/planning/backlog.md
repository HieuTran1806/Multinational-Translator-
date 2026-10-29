# Danh sách công việc tồn đọng

Phạm vi hiện hành theo [role-matrix-seller-removal-plan.md](role-matrix-seller-removal-plan.md). Seller, quản lý Seller, báo cáo Seller, đơn hàng/thanh toán và dynamic RBAC không còn là backlog và không được triển khai.

## Theo nghiệp vụ hiện hành — cần xác minh/hoàn thiện nếu còn thiếu
- UC06: kiểm tra giới hạn định vị nền trên trình duyệt và quy tắc geofence.
- UC10: quản lý tài khoản Admin chỉ bởi Super Admin, gồm soft delete và session invalidation.
- UC12: quản lý QR Admin theo chức năng hiện có; không có gán Seller hoặc thanh toán.
- UC14: Analytics toàn hệ thống chỉ dành Admin.
- UC15: Audit Log chỉ dành Super Admin.
- User web: xác minh QR activation, grant, bản đồ, POI và audio sau thay đổi.

## Kỹ thuật
- Tự động dịch không thuộc chức năng Google TTS.
- TTS cho văn bản dài hơn giới hạn nhà cung cấp: chia đoạn/ghép audio nếu được ưu tiên.
- Storage object S3/GCS/R2 và URL tạm thời: chỉ mở rộng khi có yêu cầu thực tế.
- Rate limiting đăng nhập và quản lý phiên nhiều thiết bị.
- Kiểm tra toàn vẹn media định kỳ; pin GitHub Actions theo SHA; Maven Wrapper checksum.
- Build/ký Android/iOS và phát hành cửa hàng không thuộc web-only hiện tại.
- Kiểm thử browser end-to-end cho Admin/User khi môi trường browser/API sẵn sàng.

## Tiêu chí kỹ thuật
- QR một lần; grant được xác minh ở backend và không thể cấp trùng khi redeem đồng thời.
- Analytics định nghĩa rõ nguồn, công thức, múi giờ và loại trùng lặp.
- Audit không chứa password/token/credential dạng rõ; thao tác nhạy cảm có audit trail.
- NFR chỉ được ghi đạt khi có phép đo thực tế và thông tin môi trường.
