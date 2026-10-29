# BRD — Tài liệu yêu cầu nghiệp vụ
## Hệ thống Multitional-Translator-

## 1. Tóm tắt điều hành

Hệ thống là ứng dụng User hướng dẫn tham quan đa ngôn ngữ, cho phép khám phá bản đồ/POI công khai và nghe thuyết minh sau khi kích hoạt QR dùng một lần. UC02 cấp grant cho User theo quy tắc hiện hành; quyền truy cập được kiểm tra ở backend.

Khu vực quản trị dùng chung một ứng dụng cho Admin và Super Admin nhưng phân quyền tách biệt. Admin quản lý POI, bản dịch, media/audio, QR hiện có và Analytics toàn hệ thống. Super Admin quản lý tài khoản Admin và đọc Audit Log. Seller, payment/order Seller, Seller reports và dynamic RBAC đã bị loại khỏi phạm vi hiện hành.
## 2. Bối cảnh và vấn đề nghiệp vụ

Khách tham quan cần truy cập nhanh nội dung du lịch đa ngôn ngữ mà không phải tạo tài khoản cá nhân. Đơn vị vận hành cần một quy trình bán/cấp quyền rõ ràng, có thể truy vết, trong đó QR không thể được dùng nhiều lần để cấp quyền cho nhiều thiết bị.

Đơn vị vận hành cũng cần:
- Quản lý POI, bản dịch, hình ảnh và audio.
- Quản lý Seller và tài khoản quản trị.
- Xác nhận tiền mặt, tự động đối soát chuyển khoản khi có tích hợp.
- Cấp quyền truy cập theo gói/thời hạn sau khi thanh toán hợp lệ.
- Theo dõi doanh thu, giao dịch, trạng thái QR và mức sử dụng theo Seller.
- Theo dõi số liệu tổng hợp và Audit Log theo quyền.

## 3. Mục tiêu nghiệp vụ

| ID | Mục tiêu | Kết quả mong đợi |
|---|---|---|
| BO-01 | Truy cập User | User kích hoạt QR hợp lệ một lần và nhận grant theo quy tắc hiện có |
| BO-02 | Nội dung tham quan | User xem bản đồ/POI công khai và nghe audio theo grant, publish và media version |
| BO-03 | Quản lý nội dung | Admin quản lý POI, bản dịch và media/audio |
| BO-04 | Quản lý QR | Admin tạo/xem/thu hồi QR theo API hiện có; không gán Seller |
| BO-05 | Analytics | Chỉ Admin xem Analytics toàn hệ thống |
| BO-06 | Quản trị tài khoản | Chỉ Super Admin tạo/xem/sửa/khóa/mở khóa/reset/xóa mềm tài khoản Admin |
| BO-07 | Audit | Chỉ Super Admin đọc Audit Log toàn hệ thống |
## 4. Phạm vi hệ thống

### 4.1 Trong phạm vi
- User kích hoạt QR hợp lệ và xem nội dung theo grant.
- Admin quản lý POI, bản dịch, media/audio, QR hiện có và Analytics.
- Super Admin quản lý tài khoản Admin và đọc Audit Log.
- Authentication/session theo luồng hiện có, validation và audit trail cho thao tác nhạy cảm.

### 4.2 Ngoài phạm vi
- Seller accounts, Seller management, Seller-scoped reports và Seller QR ownership.
- Đơn hàng, thanh toán, xác nhận tiền mặt/chuyển khoản hoặc tích hợp VNPAY.
- Dynamic RBAC/permission editor, profile/self-service password change và các quyền chưa được nêu trong ma trận.
## 5. Nhóm người dùng và quyền hạn

| Vai trò | Quyền hiện hành |
|---|---|
| User/khách tham quan | Kích hoạt QR hợp lệ; xem bản đồ/POI công khai; nghe audio theo grant |
| Admin | Quản lý POI, bản dịch, media/audio, QR và Analytics toàn hệ thống |
| Super Admin | Tạo/xem/sửa/khóa/mở khóa/reset mật khẩu/xóa mềm tài khoản Admin; đọc Audit Log |
| Seller | Đã loại bỏ: không còn tài khoản, session, API, UI, báo cáo hoặc dữ liệu riêng |

**Nguyên tắc quyền:** role tài khoản chỉ gồm `ADMIN` và `SUPER_ADMIN`; policy tĩnh và deny-by-default. Super Admin không kế thừa quyền Admin. User grant không phải account role. Không có permission editor.
## 6. Danh sách Use Case

| ID | Use Case | Actor | Trạng thái |
|---|---|---|---|
| UC01–UC08 | User và quản lý nội dung | User/Admin | Theo đặc tả hiện hành |
| UC09 | Quản lý tài khoản Seller | — | Đã loại bỏ |
| UC10 | Quản lý tài khoản Admin | Super Admin | Hiện hành |
| UC11 | Phân quyền | Admin/Super Admin | Policy tĩnh; dynamic RBAC ngoài phạm vi |
| UC12 | Quản lý QR truy cập | Admin | Hiện hành; không có thanh toán/đơn hàng |
| UC13 | Báo cáo Seller | — | Đã loại bỏ |
| UC14 | Analytics toàn hệ thống | Admin | Hiện hành; Super Admin bị từ chối |
| UC15 | Audit Log | Super Admin | Hiện hành |
## 7. Yêu cầu nghiệp vụ chi tiết

### 7.1 QR và quyền truy cập User

- **BR-ACCESS-01:** QR hợp lệ chỉ được kích hoạt một lần.
- **BR-ACCESS-02:** Backend xác minh token QR, trạng thái sử dụng/thu hồi và điều kiện grant trước khi cấp quyền.
- **BR-ACCESS-03:** Grant, thời hạn, publish state và media version được kiểm tra ở backend.
- **BR-ACCESS-04:** QR quản trị do Admin tạo theo UC12; không có seller ownership hoặc xác minh thanh toán.
- **BR-ACCESS-05:** QR chỉ cấp quyền User, không cấp quyền quản trị.
- **BR-ACCESS-06:** QR không hợp lệ, đã dùng hoặc đã thu hồi không được cấp grant.

### 7.2 Seller và thanh toán — đã loại bỏ

Không có nghiệp vụ Seller, đơn hàng, thanh toán, xác nhận tiền mặt/chuyển khoản hoặc tích hợp VNPAY. Không triển khai endpoint hoặc schema thay thế cho các luồng này.

### 7.3 Báo cáo Seller và Analytics

- UC13/Seller reports đã loại bỏ; không có Seller-scoped analytics.
- **BR-REPORT-01:** Chỉ Admin xem Analytics toàn hệ thống.
- **BR-REPORT-02:** Super Admin gọi Analytics API bị từ chối.
- **BR-REPORT-03:** Chỉ Super Admin đọc Audit Log; Admin không có quyền đọc Audit Log toàn hệ thống.
### 7.4 Ngôn ngữ, bản đồ và POI

- **BR-POI-01:** User có thể chọn ngôn ngữ được hỗ trợ.
- **BR-POI-02:** UI locale, POI content locale và audio locale phải được phân biệt và có fallback nhất quán.
- **BR-POI-03:** User có thể khám phá bản đồ trực tuyến, pan/zoom và chọn POI.
- **BR-POI-04:** Khi User từ chối quyền vị trí, các thao tác bản đồ không phụ thuộc GPS vẫn có thể tiếp tục.
- **BR-POI-05:** Chi tiết POI thể hiện nội dung, bản dịch, hình ảnh và audio khả dụng.
- **BR-POI-06:** Admin có thể quản lý POI và media theo quyền.
- **BR-POI-07:** POI chưa đáp ứng readiness rules không được công khai.
- **BR-POI-08:** Khi không tải được tài nguyên trực tuyến, hệ thống hiển thị lỗi/trạng thái thử lại; không chuyển sang tài nguyên ngoại tuyến.

### 7.5 Audio và chỉ hoạt động trực tuyến

- **BR-AUDIO-01:** User có thể phát audio trực tuyến khi tài nguyên phù hợp tồn tại.
- **BR-AUDIO-02:** Hệ thống thông báo rõ khi audio không khả dụng hoặc tải/phát thất bại.
- **BR-AUDIO-03:** Auto narration chỉ kích hoạt khi User bật tính năng, cho phép vị trí và điều kiện geofence đạt yêu cầu.
- **BR-AUDIO-04:** Cần xác nhận giới hạn Geolocation nền trên trình duyệt; không cam kết phát tự động khi tab đóng hoặc thiết bị khóa.
- **BR-AUDIO-05:** Admin có thể theo dõi trạng thái tác vụ audio; điều khiển Pause/Resume/Cancel cần được chốt riêng.
- **BR-WEB-01:** Website và chức năng nghiệp vụ phụ thuộc backend, bản đồ, nội dung và audio cần kết nối mạng.
- **BR-WEB-02:** Khi mất mạng, hệ thống hiển thị trạng thái ngoại tuyến/lỗi và cung cấp thử lại khi kết nối phục hồi.
- **BR-WEB-03:** Ứng dụng User không cung cấp tính năng tải/quản lý ngoại tuyến pack, ngoại tuyến map, ngoại tuyến POI hoặc ngoại tuyến audio; không tuyên bố các chức năng đó hoạt động khi mất mạng.

### 7.6 Tài khoản quản trị và RBAC

| Quyền/chức năng | Super Admin | Admin | User |
|---|---:|---:|---:|
| POI, bản dịch, media/audio, QR quản trị | 403 | Có | Không |
| Analytics toàn hệ thống | 403 | Có | Không |
| Tạo/xem/sửa/khóa/reset/xóa mềm tài khoản Admin | Có | 403 | Không |
| Đọc Audit Log | Có | 403 | Không |
| Kích hoạt QR và xem nội dung theo grant | Không thay User | Không thay User | Có |

- **BR-ADMIN-01:** UC10 chỉ quản lý tài khoản role `ADMIN`; không tạo/sửa/xóa tài khoản Super Admin.
- **BR-RBAC-01:** Role policy tĩnh, không có permission editor.
- **BR-RBAC-02:** Super Admin không kế thừa quyền Admin; mọi API quản trị được kiểm tra ở backend.
- **BR-RBAC-03:** API không khai báo bị từ chối mặc định; UI ẩn route không thay thế authorization backend.
### 7.7 Audit Log

- **BR-AUD-01:** Audit Log ghi nhận sự kiện quan trọng như quản lý Seller, thanh toán, tạo/đổi/thu hồi QR, RBAC và thao tác quản trị.
- **BR-AUD-02:** Bản ghi cần tác nhân, hành động, tài nguyên, thời điểm, kết quả và metadata an toàn phù hợp.
- **BR-AUD-03:** Không ghi password, token QR dạng rõ, credential ngân hàng hoặc dữ liệu nhạy cảm không cần thiết.
- **BR-AUD-04:** Retention, chống sửa đổi, backup và quyền quản lý audit cần được chốt.

## 8. Quy tắc nghiệp vụ tổng hợp

| ID | Quy tắc |
|---|---|
| RULE-01 | User nhận grant chỉ sau khi redeem QR hợp lệ |
| RULE-02 | QR chỉ được sử dụng một lần; grant tuân theo quy tắc hiện hành |
| RULE-03 | Admin quản lý QR; không có Seller ownership hoặc thanh toán |
| RULE-04 | Analytics toàn hệ thống chỉ dành Admin |
| RULE-05 | Accounts/Audit chỉ dành Super Admin |
| RULE-06 | Account roles chỉ gồm ADMIN/SUPER_ADMIN; không có dynamic RBAC |
| RULE-07 | Backend thực thi authorization; deny-by-default |
| RULE-08 | Không ghi password/token/credential dạng rõ vào log |
## 9. Dữ liệu nghiệp vụ chính

- **Account:** username, password hash, display name, role ADMIN/SUPER_ADMIN, trạng thái và lifecycle.
- **POI / Translation / Media:** nội dung công khai, bản dịch, media/audio và trạng thái publish.
- **Access QR:** token hash, package, trạng thái tạo/đổi/thu hồi và thời điểm; không có seller_id.
- **Access Grant:** quyền truy cập User theo QR, thiết bị và thời hạn.
- **Usage Event:** sự kiện sử dụng dùng cho Analytics toàn hệ thống.
- **Audit Log:** actor, action, resource, kết quả và chi tiết không chứa secret.
## 10. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu | Trạng thái |
|---|---|---|---|
| NFR-01 | Bảo mật QR | Token khó đoán, một lần, có thời hạn/thu hồi; đổi QR nguyên tử | Bắt buộc |
| NFR-02 | Thanh toán | Xác minh nguồn đáng tin cậy, idempotency, đối soát và audit | Bắt buộc; tích hợp TBD |
| NFR-03 | Phân quyền | Backend kiểm tra role và ownership Seller ở mọi thao tác được bảo vệ | Bắt buộc |
| NFR-04 | Chỉ hoạt động trực tuyến | Trạng thái mất mạng rõ ràng, không giả định có phương án dự phòng ngoại tuyến | Bắt buộc |
| NFR-05 | Quyền riêng tư | Hạn chế dữ liệu User và thông tin nhạy cảm trong log/báo cáo | Bắt buộc |
| NFR-06 | Tính toàn vẹn | Không cấp quyền khi không xác minh được thanh toán/QR | Bắt buộc |
| NFR-07 | Hiệu năng | API thường P95 < 500 ms; redeem QR/cấp quyền P95 < 1 giây, không tính hệ thống ngoài | Mục tiêu MVP đề xuất, cần đo kiểm |
| NFR-08 | Khả năng mở rộng | Tải đồng thời cần được định nghĩa trong kịch bản demo; không tuyên bố năng lực production | Cần đo kiểm theo tải demo |
| NFR-09 | Khả dụng | Mục tiêu tham khảo 99,5%/tháng; RPO ≤ 24 giờ, RTO ≤ 8 giờ nếu triển khai sao lưu/khôi phục | Mục tiêu đề xuất, chưa đo kiểm |
| NFR-10 | Tương thích | Kiểm thử trình duyệt desktop/mobile được xác định; xử lý từ chối camera/Geolocation/autoplay | Cần ghi trong test report |
| NFR-11 | Audit | Không ghi secret/token QR dạng rõ; giới hạn quyền đọc/ghi log | Retention và chống sửa đổi cần chốt trước production |

## 11. Tiêu chí nghiệm thu cấp cao

- **AC-01:** QR không hợp lệ/đã dùng/đã thu hồi không cấp grant; User vẫn truy cập nội dung theo grant hợp lệ.
- **AC-02:** Admin quản lý POI/bản dịch/media/QR và xem Analytics; Super Admin bị từ chối ở các API này.
- **AC-03:** Chỉ Super Admin quản lý tài khoản Admin và đọc Audit Log; Admin bị từ chối.
- **AC-04:** UC09 và UC13 không còn API/UI/data nghiệp vụ; UC12 không có thanh toán/đơn hàng Seller.
- **AC-05:** Production schema không có role Seller hoặc cột access_qr.seller_id; dữ liệu QR/grant/usage/audit ngoài phạm vi được giữ.
- **AC-06:** Các kiểm tra/build đã chạy có output thật; không chạy test trên production.
## 12. Giả định, phụ thuộc và TBD

### 12.1 Giả định đã xác nhận
- QR User được Admin tạo theo UC12 hiện hành; User redeem để nhận grant.
- Seller, payment/order, Seller reports và dynamic RBAC không thuộc phạm vi hiện hành.
- Super Admin quản lý tài khoản Admin và Audit Log; không được gọi API nghiệp vụ Admin/Analytics.

### 12.2 Còn cần đặc tả/kiểm chứng
- NFR phải được đo kiểm bằng môi trường và số liệu thực tế trước khi tuyên bố đạt.
- Bootstrap Super Admin trên production cần thông tin xác thực và quy trình được ủy quyền; không tự promote tài khoản Admin.
- Tích hợp thanh toán/đơn hàng chỉ được xem xét qua yêu cầu và phê duyệt riêng trong tương lai.
