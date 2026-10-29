# BRD — Tài liệu yêu cầu nghiệp vụ

**Phiên bản hiện hành:** 2026-10-29. Kế hoạch chuẩn: [role-matrix-seller-removal-plan.md](../planning/role-matrix-seller-removal-plan.md).

## 1. Mục tiêu và phạm vi

Hệ thống cung cấp bản đồ tham quan đa ngôn ngữ, POI công khai và audio thuyết minh. User kích hoạt QR hợp lệ để nhận grant, sau đó truy cập bản đồ/POI/audio theo trạng thái publish, thời hạn grant và quy tắc media hiện có. Khu quản trị dùng chung một ứng dụng và trang đăng nhập cho Admin/Super Admin; backend là nguồn quyết định quyền cuối cùng.

Trong phạm vi: quản lý POI, bản dịch, media/audio và QR; Analytics toàn hệ thống cho Admin; quản lý tài khoản Admin và Audit Log cho Super Admin; authentication/session theo luồng hiện có; kiểm soát grant User.

Ngoài phạm vi: Seller, tài khoản Seller, báo cáo Seller, QR ownership Seller, đơn hàng/thanh toán, tích hợp VNPAY, dynamic RBAC/permission editor, self-service profile/password change và quyền chưa được nêu trong ma trận.

## 2. Vai trò và quyền hạn

| Vai trò | Quyền được phép | Quyền bị từ chối |
|---|---|---|
| User/khách tham quan | Kích hoạt QR hợp lệ; xem bản đồ/POI công khai; nghe audio theo grant hợp lệ | Mọi API quản trị |
| Admin | Quản lý POI, bản dịch, media/audio, QR hiện có; xem Analytics toàn hệ thống | Quản lý tài khoản Admin; Audit Log; Seller/API Seller |
| Super Admin | Tạo/xem/sửa/khóa/mở khóa/reset mật khẩu/xóa mềm tài khoản Admin; đọc Audit Log | POI, translation, media, QR quản trị, Analytics, Seller/API Seller |
| Seller | Không tồn tại trong hệ thống hiện hành | Đăng nhập/session, API, UI, báo cáo, ownership hoặc dữ liệu riêng |

Role là policy tĩnh, deny-by-default. Không có permission editor. Super Admin không tự xóa mình; không xóa mềm tài khoản Super Admin qua API quản lý Admin. Không cho Admin tự nâng quyền.

## 3. Mục tiêu nghiệp vụ

| ID | Mục tiêu | Kết quả mong đợi |
|---|---|---|
| BO-01 | Truy cập User | QR hợp lệ được kích hoạt một lần và tạo grant theo quy tắc hiện có |
| BO-02 | Khám phá POI | User xem bản đồ, POI công khai và nội dung đúng ngôn ngữ |
| BO-03 | Thuyết minh | Audio được phục vụ theo publish, grant và media version hiện có |
| BO-04 | Quản lý nội dung | Admin quản lý POI, bản dịch, media/audio |
| BO-05 | QR | Admin tạo/xem/thu hồi QR theo chức năng hiện có; không gán Seller |
| BO-06 | Analytics | Chỉ Admin xem số liệu toàn hệ thống |
| BO-07 | Quản trị tài khoản | Chỉ Super Admin quản lý tài khoản Admin |
| BO-08 | Kiểm toán | Chỉ Super Admin đọc Audit Log; không lộ credential/token |

## 4. Use Case và trạng thái

- UC01–UC08: User và quản lý nội dung theo đặc tả hiện hành.
- UC09: đã loại bỏ — không quản lý Seller.
- UC10: Super Admin quản lý tài khoản Admin.
- UC11: ma trận role tĩnh; không triển khai dynamic RBAC.
- UC12: Admin quản lý QR hiện có; không có thanh toán/đơn hàng.
- UC13: đã loại bỏ — không có báo cáo Seller.
- UC14: Analytics toàn hệ thống, chỉ Admin.
- UC15: Audit Log, chỉ Super Admin.

## 5. Yêu cầu bảo mật và dữ liệu

- Matcher cụ thể cho Accounts/Audit/Analytics phải đứng trước `/api/v1/admin/**`; Super Admin không kế thừa quyền Admin.
- Các kiểm tra service-level phải nhất quán với controller và SecurityConfig.
- User grant không phải account role; mọi truy cập User tiếp tục xác minh grant ở backend.
- Xóa dữ liệu Seller chỉ theo quan hệ đã xác minh; không xóa QR Admin, grant/usage User không thuộc Seller hoặc audit ngoài phạm vi.
- Password phải được hash; session bị vô hiệu hóa theo lifecycle hiện có; không ghi credential/token vào log.
- Không chạy test suite hoặc thao tác kiểm thử ghi dữ liệu trên production.

## 6. Tiêu chí nghiệm thu

- Chỉ còn role tài khoản `ADMIN` và `SUPER_ADMIN`.
- Analytics chỉ cho Admin; Accounts/Audit chỉ cho Super Admin; API nghiệp vụ Admin chỉ cho Admin.
- Hai Web UI phản ánh cùng ma trận quyền và chặn route trực tiếp.
- User QR/grant/map/POI/audio không bị ảnh hưởng.
- Production schema/data được hậu kiểm; migration history nhất quán.
- Tài liệu và kết quả kiểm thử phản ánh bằng chứng thực tế; không push/deploy khi chưa được cho phép.
