# Kế hoạch và giả định hiện hành

**Ngày cập nhật:** 2026-10-29. Quyết định chuẩn: [role-matrix-seller-removal-plan.md](role-matrix-seller-removal-plan.md).

## Phạm vi hiện hành

- User: kích hoạt QR hợp lệ, xem bản đồ/POI công khai và nghe audio theo grant.
- Admin: quản lý POI, bản dịch, media/audio, QR hiện có và Analytics toàn hệ thống.
- Super Admin: quản lý tài khoản Admin (tạo, danh sách/chi tiết, sửa tên hiển thị, khóa/mở khóa, reset mật khẩu, xóa mềm) và đọc Audit Log.
- Seller, thanh toán, đơn hàng, Seller report, Seller QR ownership và dynamic RBAC/permission editor: đã loại bỏ, không nằm trong backlog.
- UC09 và UC13 được giữ số hiệu để truy vết lịch sử nhưng trạng thái hiện hành là đã loại bỏ. UC12 chỉ quản lý QR theo chức năng hiện có.

## Quy tắc kỹ thuật

- Role tài khoản chỉ gồm `ADMIN` và `SUPER_ADMIN`; policy tĩnh, deny-by-default.
- Super Admin không được gọi API nghiệp vụ Admin hoặc Analytics. Admin không được gọi Accounts/Audit.
- User grant là cơ chế truy cập nội dung, không phải account role.
- Giữ lịch sử migration Flyway đã áp dụng; thay đổi schema chỉ bằng migration mới.
- Không dùng production để chạy test; production chỉ được hậu kiểm bằng truy vấn đọc sau migration.
- Những bảng phiên bản mobile/Android/iOS dưới đây trong các bản cũ là lịch sử, không mô tả phạm vi ứng dụng hiện tại.

## Kiểm chứng trong lượt cập nhật 2026-10-29

- Flyway V6 `remove seller role and data` đã áp dụng thành công trên Neon production; schema version hiện tại là 6.
- Hậu kiểm: không còn role/tài khoản Seller, không còn cột `access_qr.seller_id` hoặc index liên quan; giữ nguyên 1 QR, 1 grant và 2 audit records hiện hữu.
- Backend unit tests: 60/60 đạt; Web Admin: 56/56 test đạt, lint và build đạt ở lượt kiểm tra gần nhất.
- Production có 1 tài khoản Admin active nhưng **không có tài khoản Super Admin**. Không tự ý tạo tài khoản đặc quyền hoặc đặt mật khẩu thay người dùng; cần xử lý bootstrap Super Admin riêng để vận hành UC10/UC15.
- Không push, deploy hoặc release.
