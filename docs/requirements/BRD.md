# BRD — Business Requirements Document
## Hệ thống Multitional-Translator-

## 1. Tóm tắt điều hành

Hệ thống là ứng dụng User hướng dẫn tham quan đa ngôn ngữ, cho phép User khám phá bản đồ/POI và nghe thuyết minh sau khi kích hoạt quyền qua QR dùng một lần. UC12 (thanh toán/tạo QR nội bộ) ngoài MVP. QR phải riêng cho từng khách hàng; Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công. UC02 kích hoạt QR một lần và cấp quyền 24 giờ trên thiết bị đã kích hoạt.

UC12 (thanh toán/quản lý giao dịch/tạo QR nội bộ) ngoài MVP. UC12 ngoài MVP; Seller tạo và cấp QR riêng cho từng khách hàng sau khi thanh toán thành công. UC02 kích hoạt QR một lần và cấp quyền 24 giờ kể từ khi kích hoạt thành công. VNPAY Sandbox chỉ là phương án tham khảo cho giai đoạn sau.

Ứng dụng User React Native là **online-only**. Khi mất mạng, người dùng không thể tiếp tục sử dụng các trang/tính năng phụ thuộc dịch vụ trực tuyến. Hệ thống phải hiển thị trạng thái kết nối/lỗi phù hợp và cho phép thử lại, không quảng bá hoặc cung cấp chức năng offline.

Khu vực quản trị cung cấp quản lý POI/audio, tài khoản Seller/Admin, RBAC, Analytics toàn hệ thống và Audit Log. Seller có báo cáo riêng về doanh thu, giao dịch và usage chỉ trong phạm vi dữ liệu của chính Seller.

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
| BO-01 | Truy cập nhanh cho User | User quét QR hợp lệ, không cần tài khoản Tourist, và dùng chức năng trong thời hạn đã cấp |
| BO-02 | Cấp quyền User | User kích hoạt QR riêng; Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công. Quản lý giao dịch/thanh toán/tạo QR nội bộ (UC12) ngoài MVP |
| BO-03 | Kiểm soát tái sử dụng QR | Mỗi QR chỉ đổi thành công một lần; backend kiểm tra tính hợp lệ và thời hạn |
| BO-04 | Hỗ trợ khám phá POI | User xem bản đồ, chi tiết POI và nội dung đa ngôn ngữ khi online |
| BO-05 | Cung cấp thuyết minh | User phát audio thủ công hoặc dùng auto narration trong giới hạn trình duyệt |
| BO-06 | Vận hành nội dung | Admin quản lý POI, bản dịch, media và tác vụ audio |
| BO-07 | Quản lý Seller và quản trị | Admin/Super Admin quản lý tài khoản; RBAC bảo vệ các chức năng |
| BO-08 | Báo cáo và truy vết | Seller xem báo cáo của mình; Admin/Super Admin xem Analytics hệ thống; Super Admin xem Audit Log |
| BO-09 | Online-only minh bạch | Khi mất mạng, hệ thống thông báo rõ và không hứa hẹn khả năng offline |

## 4. Phạm vi hệ thống

### 4.1 Trong phạm vi

- Chọn/chuyển đổi ngôn ngữ UI và nội dung POI.
- Quét QR và kích hoạt quyền User có thời hạn.
- Bản đồ trực tuyến, định vị trình duyệt, tìm/chọn POI.
- Xem chi tiết POI, bản dịch và hình ảnh.
- Phát audio trực tuyến và thuyết minh tự động theo vị trí khi hệ điều hành và quyền vị trí cho phép.
- Quản lý POI, bản dịch, hình ảnh/audio và tác vụ audio.
- Admin tạo và quản lý tài khoản Seller; Super Admin không có quyền quản lý Seller.
- Super Admin là vai trò duy nhất được tạo/quản lý tài khoản Admin và quản lý RBAC.
- UC12 và nghiệp vụ tạo QR nội bộ ngoài MVP. Mỗi khách hàng phải có QR riêng; Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công. UC02 chỉ kích hoạt QR một lần, cấp quyền 24 giờ gắn với thiết bị kích hoạt.
- Mỗi khách hàng có QR riêng, chỉ kích hoạt một lần. Quyền có hiệu lực 24 giờ kể từ kích hoạt thành công và gắn với thiết bị đã kích hoạt.
- Seller xem báo cáo doanh thu, giao dịch và usage của chính mình.
- Admin và Super Admin xem Analytics toàn hệ thống; chỉ Super Admin xem Audit Log.
- Super Admin xem Audit Log.

### 4.2 Ngoài phạm vi

- Đăng ký/đăng nhập/đăng xuất Tourist/User bằng tài khoản cá nhân.
- Tải, cài đặt, cập nhật hoặc gỡ gói offline.
- Offline map, offline POI snapshot, offline images/audio hoặc tiếp tục sử dụng khi mất mạng.
- Seller tự đăng ký tài khoản.
- QR cấp quyền quản trị.
- Seller truy cập/sửa dữ liệu giao dịch hoặc báo cáo của Seller khác.
- Tự động xác nhận tiền mặt; tiền mặt do Seller xác nhận.
- Tự động xác nhận chuyển khoản nếu chưa tích hợp nguồn xác minh ngân hàng/đơn vị thanh toán đáng tin cậy.
- Hoàn tiền, hủy giao dịch, xuất dữ liệu báo cáo và các nghiệp vụ tài chính nâng cao cho đến khi được xác nhận riêng.

## 5. Nhóm người dùng và quyền hạn

| Nhóm | Mô tả |
|---|---|
| User | Khách tham quan; kích hoạt quyền bằng QR dùng một lần và truy cập tính năng User trong thời hạn dịch vụ |
| Seller | Tài khoản do Admin tạo; tạo giao dịch, xác nhận tiền mặt, theo dõi thanh toán, hiển thị QR và xem báo cáo dữ liệu của chính mình |
| Admin | Quản lý POI/nội dung/audio, tạo/quản lý Seller và xem Analytics |
| Super Admin | Quản lý tài khoản Admin và RBAC, xem Audit Log toàn hệ thống; không quản lý POI hoặc Seller |
| Ngân hàng/đơn vị thanh toán | Ngoài MVP; chỉ bổ sung khi UC12 được duyệt triển khai |
| Chủ sản phẩm | Xác nhận quy tắc gói dịch vụ, thanh toán, thời hạn, báo cáo và tiêu chí nghiệm thu |

**Nguyên tắc quyền:** Seller chỉ truy cập dữ liệu thuộc Seller của phiên đăng nhập đang xác thực. Backend phải tự xác định Seller từ phiên, không tin cậy mã Seller do client gửi.

## 6. Danh sách Use Case

| ID | Use Case | Actor | Mục tiêu |
|---|---|---|---|
| UC01 | Chọn / Chuyển đổi ngôn ngữ | User | Chọn ngôn ngữ giao diện/nội dung |
| UC02 | Quét QR và kích hoạt quyền truy cập User | User | Đổi QR hợp lệ thành quyền truy cập có thời hạn |
| UC03 | Khám phá bản đồ tương tác | User | Khám phá POI trực tuyến |
| UC04 | Xem chi tiết POI | User | Xem nội dung, bản dịch, hình ảnh |
| UC05 | Nghe thuyết minh POI | User | Phát audio trực tuyến |
| UC06 | Nhận thuyết minh tự động theo vị trí | User | Tự phát audio khi điều kiện vị trí đáp ứng |
| UC07 | Quản lý POI, bản dịch và media | Admin | Duy trì nội dung tham quan |
| UC08 | Giám sát tiến độ tạo Audio | Admin | Theo dõi trạng thái xử lý audio |
| UC09 | Quản lý tài khoản Seller | Admin | Tạo/cập nhật/vô hiệu hóa Seller |
| UC10 | Quản lý tài khoản Admin | Super Admin | Quản lý tài khoản quản trị |
| UC11 | Quản lý vai trò và phân quyền (RBAC) | Super Admin | Quản lý role/permission |
| UC12 | Quản lý thanh toán và tạo QR truy cập | Seller | Ghi nhận thanh toán và phát QR dùng một lần |
| UC13 | Xem thống kê và báo cáo Seller | Seller | Xem doanh thu, giao dịch, usage của chính mình |
| UC14 | Xem Analytics toàn hệ thống | Admin | Xem số liệu tổng hợp theo quyền |
| UC15 | Xem Audit Log | Super Admin | Truy vết hoạt động quan trọng |

Chi tiết luồng chính, ngoại lệ, điều kiện tiên quyết và dependency nằm trong Use Case Specification.

## 7. Yêu cầu nghiệp vụ chi tiết

### 7.1 QR và quyền truy cập User

- **BR-ACCESS-01:** User không cần đăng ký, đăng nhập hoặc đăng xuất bằng tài khoản cá nhân.
- **BR-ACCESS-02:** User phải đổi QR hợp lệ để kích hoạt quyền truy cập đối với các chức năng yêu cầu cấp quyền.
- **BR-ACCESS-03:** Backend xác minh token QR, giao dịch, trạng thái thanh toán, thời hạn, trạng thái sử dụng và thu hồi trước khi cấp quyền.
- **BR-ACCESS-04:** Một QR chỉ được đổi thành công một lần; thao tác đổi phải nguyên tử để tránh hai yêu cầu đồng thời cùng thành công.
- **BR-ACCESS-05:** QR chỉ cấp quyền User, không cấp quyền Seller/Admin.
- **BR-ACCESS-06:** MVP/demo chỉ có một gói giá 1 VND, thời hạn 24 giờ; đồng hồ bắt đầu tại thời điểm đổi QR thành công.
- **BR-ACCESS-07:** Không cấp quyền khi không thể xác minh trạng thái QR/thanh toán từ backend.
- **BR-ACCESS-08:** Token QR phải khó đoán, có thể thu hồi và không ghi dạng rõ vào log.

### 7.2 Thanh toán và Seller

- **BR-PAY-01:** Admin tạo và quản lý tài khoản Seller; Super Admin không có quyền quản lý Seller; Seller không tự đăng ký.
- **BR-PAY-02:** Seller chỉ thao tác trên giao dịch và QR do chính Seller sở hữu.
- **BR-PAY-03:** Với tiền mặt, Seller xác nhận đã nhận tiền; hệ thống ghi nhận người thao tác, thời điểm, số tiền và phương thức.
- **BR-PAY-04:** Với chuyển khoản, hệ thống tự cập nhật thanh toán chỉ sau khi nhận xác nhận đáng tin cậy từ tích hợp ngân hàng/đơn vị thanh toán.
- **BR-PAY-05:** Không tạo QR kích hoạt trước khi giao dịch đạt trạng thái đã thanh toán hợp lệ.
- **BR-PAY-06:** Mọi webhook/notification thanh toán phải xử lý idempotent để tránh ghi nhận trùng.
- **BR-PAY-07:** Giao dịch không khớp số tiền/mã tham chiếu phải chuyển trạng thái cần kiểm tra, không tự đánh dấu thành công.
- **BR-PAY-08:** Thanh toán/giao dịch nội bộ thuộc UC12 ngoài MVP. Nếu được triển khai sau này, gói dịch vụ phải lấy từ cấu hình/dữ liệu và chính sách hủy/hoàn tiền phải được chốt lại; VNPAY Sandbox chỉ là phương án thử nghiệm có điều kiện.

### 7.3 Báo cáo Seller và Analytics

- **BR-REPORT-01:** Seller xem báo cáo doanh thu theo ngày/tháng và phương thức thanh toán.
- **BR-REPORT-02:** Seller xem số giao dịch theo trạng thái và phương thức thanh toán.
- **BR-REPORT-03:** Seller xem số QR tạo/đổi/chưa đổi/hết hạn/thu hồi nếu trạng thái tương ứng được hỗ trợ.
- **BR-REPORT-04:** Seller xem usage theo các sự kiện đã được định nghĩa, ví dụ lượt truy cập, xem POI và phát audio.
- **BR-REPORT-05:** Seller chỉ được xem dữ liệu của chính mình; backend thực thi ownership.
- **BR-REPORT-06:** Admin và Super Admin có thể xem Analytics toàn hệ thống; chỉ Super Admin được xem Audit Log, tách biệt khỏi báo cáo riêng của Seller.
- **BR-REPORT-07:** Metric usage, múi giờ `Asia/Ho_Chi_Minh`, độ trễ mục tiêu 5 phút, event thô 90 ngày và tổng hợp 13 tháng; doanh thu chỉ có hiệu lực khi UC12 được triển khai.
- **BR-REPORT-08:** Không hiển thị dữ liệu cá nhân nhạy cảm không cần thiết trong báo cáo.

### 7.4 Ngôn ngữ, bản đồ và POI

- **BR-POI-01:** User có thể chọn ngôn ngữ được hỗ trợ.
- **BR-POI-02:** UI locale, POI content locale và audio locale phải được phân biệt và có fallback nhất quán.
- **BR-POI-03:** User có thể khám phá bản đồ trực tuyến, pan/zoom và chọn POI.
- **BR-POI-04:** Khi User từ chối quyền vị trí, các thao tác bản đồ không phụ thuộc GPS vẫn có thể tiếp tục.
- **BR-POI-05:** Chi tiết POI thể hiện nội dung, bản dịch, hình ảnh và audio khả dụng.
- **BR-POI-06:** Admin có thể quản lý POI và media theo quyền.
- **BR-POI-07:** POI chưa đáp ứng readiness rules không được công khai.
- **BR-POI-08:** Khi tài nguyên online không tải được, hệ thống hiển thị lỗi/trạng thái retry; không chuyển sang offline resources.

### 7.5 Audio và online-only

- **BR-AUDIO-01:** User có thể phát audio trực tuyến khi tài nguyên phù hợp tồn tại.
- **BR-AUDIO-02:** Hệ thống thông báo rõ khi audio không khả dụng hoặc tải/phát thất bại.
- **BR-AUDIO-03:** Auto narration chỉ kích hoạt khi User bật tính năng, cho phép vị trí và điều kiện geofence đạt yêu cầu.
- **BR-AUDIO-04:** Cần xác nhận giới hạn Geolocation nền trên trình duyệt; không cam kết phát tự động khi tab đóng hoặc thiết bị khóa.
- **BR-AUDIO-05:** Admin có thể theo dõi trạng thái tác vụ audio; điều khiển Pause/Resume/Cancel cần được chốt riêng.
- **BR-WEB-01:** Website và chức năng nghiệp vụ phụ thuộc backend, bản đồ, nội dung và audio cần kết nối mạng.
- **BR-WEB-02:** Khi mất mạng, hệ thống hiển thị trạng thái offline/lỗi và cung cấp thử lại khi kết nối phục hồi.
- **BR-WEB-03:** Ứng dụng User không cung cấp tính năng tải/quản lý offline pack, offline map, offline POI hoặc offline audio; không tuyên bố các chức năng đó hoạt động khi mất mạng.

### 7.6 Tài khoản quản trị và RBAC
### Ma trận RBAC đã xác nhận

| Quyền/chức năng | Super Admin | Admin | Seller |
|---|---|---|---|
| Quản lý POI, bản dịch, hình ảnh, audio và TTS | Không | Có | Không |
| Tạo/quản lý tài khoản Admin | Có | Không | Không |
| Tạo/quản lý tài khoản Seller | Không | Có | Không |
| Quản lý RBAC/vai trò | Có | Không | Không |
| Xem Analytics toàn hệ thống | Có | Có | Không |
| Xem Audit Log toàn hệ thống | Có | Không | Không |

Quy tắc bảo vệ tài khoản Super Admin: Super Admin không được tự thay đổi vai trò hoặc tự vô hiệu hóa chính mình. Thay đổi vai trò/trạng thái tài khoản Super Admin phải do Super Admin khác thực hiện; sau thao tác phải còn ít nhất một Super Admin đang hoạt động. Backend bắt buộc kiểm tra quyền và điều kiện này; ẩn nút trên giao diện không đủ.

- **BR-ADMIN-01:** Chỉ Admin được tạo, cập nhật và vô hiệu hóa tài khoản Seller. Super Admin không được quản lý Seller.
- **BR-ADMIN-02:** Super Admin quản lý tài khoản Admin.
- **BR-RBAC-01:** Mọi thao tác quản trị phải được backend kiểm tra quyền.
- **BR-RBAC-02:** Seller chỉ truy cập dữ liệu của mình; mọi endpoint giao dịch/báo cáo phải kiểm tra ownership.
- **BR-RBAC-03:** Chỉ Super Admin được tạo/quản lý Admin và cấu hình RBAC; chỉ Admin được tạo/quản lý Seller. Super Admin không quản lý POI hoặc Seller.
- **BR-RBAC-04:** Super Admin không tự đổi vai trò hoặc tự vô hiệu hóa chính mình. Mọi thay đổi vai trò/trạng thái tài khoản Super Admin phải do Super Admin khác thực hiện và sau thao tác vẫn còn ít nhất một Super Admin khác đang hoạt động.

### 7.7 Audit Log

- **BR-AUD-01:** Audit Log ghi nhận sự kiện quan trọng như quản lý Seller, thanh toán, tạo/đổi/thu hồi QR, RBAC và thao tác quản trị.
- **BR-AUD-02:** Bản ghi cần actor, action, resource, timestamp, kết quả và metadata an toàn phù hợp.
- **BR-AUD-03:** Không ghi password, token QR dạng rõ, credential ngân hàng hoặc dữ liệu nhạy cảm không cần thiết.
- **BR-AUD-04:** Retention, chống sửa đổi, backup và quyền quản lý audit cần được chốt.

## 8. Quy tắc nghiệp vụ tổng hợp

| ID | Quy tắc |
|---|---|
| RULE-01 | Không yêu cầu tài khoản Tourist/User cá nhân; quyền truy cập được kích hoạt qua QR |
| RULE-02 | QR chỉ đổi thành công một lần |
| RULE-03 | QR chỉ được tạo/hiển thị để kích hoạt sau khi thanh toán đã được xác nhận |
| RULE-04 | Quyền User hết hạn theo gói/dịch vụ |
| RULE-05 | Tiền mặt do Seller xác nhận; chuyển khoản xác minh tự động qua tích hợp đáng tin cậy |
| RULE-06 | Seller chỉ xem/thao tác dữ liệu của chính mình |
| RULE-07 | Không cấp quyền khi QR/thanh toán không xác minh được |
| RULE-08 | Ứng dụng User React Native online-only; không có gói offline hoặc fallback offline |
| RULE-09 | Role/permission được kiểm tra phía backend |
| RULE-10 | Audit sự kiện tài chính/QR và thay đổi quyền theo chính sách được chốt |

## 9. Dữ liệu nghiệp vụ chính

- **Admin/Seller Account:** định danh, trạng thái, thông tin xác thực/role.
- **Service Package:** mã gói, giá, thời hạn và phạm vi quyền User.
- **Transaction:** Seller sở hữu, số tiền, phương thức, trạng thái, thời điểm và tham chiếu thanh toán.
- **Payment Confirmation:** nguồn xác minh, mã tham chiếu, số tiền, thời điểm và trạng thái đối soát.
- **Access QR/Token:** giao dịch, Seller, trạng thái tạo/đổi/hết hạn/thu hồi và thời hạn.
- **User Access Session/Grant:** thời điểm kích hoạt, thời hạn, trạng thái và cơ chế thu hồi.
- **Usage Events:** các sự kiện đã định nghĩa cho lượt truy cập, xem POI và phát audio.
- **POI/Translation/Media/Audio Task:** dữ liệu nội dung tham quan.
- **Role/Permission:** cấu hình quyền.
- **Analytics Read Models:** số liệu tổng hợp.
- **Audit Record:** actor, action, resource, timestamp, outcome và metadata an toàn.

Schema chi tiết, retention, phân loại dữ liệu và quy tắc xóa phải được xác định trong SRS/data dictionary.

## 10. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu | Trạng thái |
|---|---|---|---|
| NFR-01 | Bảo mật QR | Token khó đoán, một lần, có thời hạn/thu hồi; đổi QR nguyên tử | Bắt buộc |
| NFR-02 | Thanh toán | Xác minh nguồn đáng tin cậy, idempotency, đối soát và audit | Bắt buộc; tích hợp TBD |
| NFR-03 | Phân quyền | Backend kiểm tra role và ownership Seller ở mọi thao tác được bảo vệ | Bắt buộc |
| NFR-04 | Online-only | Trạng thái mất mạng rõ ràng, không giả định offline fallback | Bắt buộc |
| NFR-05 | Quyền riêng tư | Hạn chế dữ liệu User và thông tin nhạy cảm trong log/báo cáo | Bắt buộc |
| NFR-06 | Tính toàn vẹn | Không cấp quyền khi không xác minh được thanh toán/QR | Bắt buộc |
| NFR-07 | Hiệu năng | API thường P95 < 500 ms; redeem QR/cấp quyền P95 < 1 giây, không tính hệ thống ngoài | Mục tiêu MVP đề xuất, cần đo kiểm |
| NFR-08 | Khả năng mở rộng | Tải đồng thời cần được định nghĩa trong kịch bản demo; không tuyên bố năng lực production | Cần đo kiểm theo tải demo |
| NFR-09 | Khả dụng | Mục tiêu tham khảo 99,5%/tháng; RPO ≤ 24 giờ, RTO ≤ 8 giờ nếu triển khai backup/restore | Mục tiêu đề xuất, chưa đo kiểm |
| NFR-10 | Tương thích | Kiểm thử trình duyệt desktop/mobile được xác định; xử lý từ chối camera/Geolocation/autoplay | Cần ghi trong test report |
| NFR-11 | Audit | Không ghi secret/token QR dạng rõ; giới hạn quyền đọc/ghi log | Retention và chống sửa đổi cần chốt trước production |

## 11. Tiêu chí nghiệm thu cấp cao

| ID | Điều kiện nghiệm thu |
|---|---|
| AC-01 | User không cần đăng ký/đăng nhập/đăng xuất tài khoản cá nhân |
| AC-02 | QR không hợp lệ, đã dùng hoặc bị thu hồi không cấp quyền; QR không tự hết hạn trước khi kích hoạt; vẫn có thể bị thu hồi. Xác minh thanh toán nội bộ thuộc UC12 ngoài MVP |
| AC-03 | Hai yêu cầu đồng thời đổi cùng QR không thể cùng được cấp quyền |
| AC-04 | QR hợp lệ chỉ redeem một lần; quyền demo có thời hạn 24 giờ kể từ lúc kích hoạt thành công theo cấu hình tham khảo; mô hình gói phải mở rộng được và bán gói thuộc UC12 ngoài MVP |
| AC-05 | UC12 ngoài MVP; không có yêu cầu nghiệm thu tích hợp VNPAY trong MVP |
| AC-06 | Idempotency webhook là tiêu chí cho giai đoạn sau khi UC12 được đưa vào phạm vi, không phải tiêu chí nghiệm thu MVP |
| AC-07 | Khi UC12/UC13 được triển khai, Seller A không thể xem/sửa dữ liệu giao dịch, QR hay báo cáo của Seller B bằng cách thay ID/request |
| AC-08 | Báo cáo Seller chỉ hiển thị dữ liệu thuộc Seller đó; doanh thu/giao dịch chỉ khả dụng khi UC12 được triển khai, usage theo metric đã định nghĩa |
| AC-09 | Admin quản lý Seller; Super Admin không quản lý Seller; Super Admin quản lý Admin/RBAC theo quyền |
| AC-10 | User có thể khám phá bản đồ, xem POI và phát audio khi ứng dụng User online |
| AC-11 | Khi mất mạng, ứng dụng User báo trạng thái phù hợp và không giả lập tính năng offline |
| AC-12 | Analytics toàn hệ thống và báo cáo Seller có phạm vi dữ liệu riêng biệt |
| AC-13 | Audit Log ghi nhận sự kiện trọng yếu đã chốt và không lộ token/credential nhạy cảm |
| AC-14 | Các lỗi dịch vụ/thanh toán/QR có thông báo rõ; không cấp quyền hoặc báo thành công giả |

## 12. Giả định, phụ thuộc và TBD

### 12.1 Giả định đã xác nhận
- Không có đăng ký/đăng nhập/đăng xuất Tourist/User.
- Chỉ Admin tạo tài khoản Seller.
- Thanh toán/tạo QR nội bộ không thuộc MVP. Theo quy tắc nghiệp vụ đích, Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công; QR không tự hết hạn trước khi kích hoạt. UC12 vẫn ngoài MVP.
- QR riêng cho từng khách hàng chỉ kích hoạt một lần; quyền gắn với thiết bị đã kích hoạt, có thể khôi phục trên chính thiết bị đó trong 24 giờ và không chuyển/khôi phục sang thiết bị khác. Gói `DEMO_24H` 1 VND chỉ là cấu hình demo tham khảo.
- Seller chỉ xem/thao tác dữ liệu của chính mình.
- Seller có thể xem/lọc số liệu doanh thu, giao dịch và usage trong phạm vi được phép; không có chức năng xuất báo cáo.
- Ứng dụng User React Native online-only, không có chức năng offline.

### 12.2 Còn cần đặc tả/kiểm chứng trước nghiệm thu hoặc production
1. UC12 ngoài MVP; khi được đưa vào phạm vi, mới chọn nhà cung cấp thanh toán và thiết kế xác minh callback/đối soát.
2. Không hỗ trợ chuyển thiết bị hoặc khôi phục quyền sang thiết bị khác. QR không tự hết hạn trước khi kích hoạt; vẫn có thể bị thu hồi. Gói 24 giờ là cấu hình demo tham khảo; UC12 ngoài MVP.
3. Metric definitions: công thức, nguồn, múi giờ, deduplication và độ trễ. Không có chức năng xuất báo cáo.
4. Cách cấp QR cho từng khách hàng; retention/audit và chi tiết triển khai RBAC.
5. Retention Audit Log, mức chống sửa đổi, backup và cách xử lý khi kho log lỗi.
6. Đo kiểm các mục tiêu hiệu năng/khả dụng/RPO/RTO; hiện chưa có bằng chứng đã đạt.
7. Danh sách trình duyệt/thiết bị hỗ trợ và giới hạn thực tế của Geolocation/autoplay.
8. Mọi bước chuyển sang thanh toán production nằm ngoài phạm vi demo, cần quyết định và rà soát bảo mật riêng.
## 13. Rủi ro nghiệp vụ

| ID | Rủi ro | Hướng xử lý |
|---|---|---|
| R-01 | QR bị chụp/chia sẻ trước khi đổi | Token khó đoán, redeem một lần, trạng thái thu hồi; không đặt hạn tự hết hiệu lực trước lần redeem đầu tiên |
| R-02 | Hai thiết bị đổi QR đồng thời | Đổi token bằng giao dịch nguyên tử/idempotency |
| R-03 | Xác nhận chuyển khoản giả hoặc trùng | Webhook ký/xác minh, đối soát và idempotency |
| R-04 | Seller xác nhận nhầm tiền mặt | Ghi audit actor/thời gian/số tiền; quyền điều chỉnh phải được kiểm soát |
| R-05 | Seller đọc dữ liệu Seller khác | Ownership enforcement ở backend và kiểm thử IDOR |
| R-06 | Báo cáo doanh thu sai định nghĩa | Chốt gross/net, hoàn tiền, múi giờ và nguồn dữ liệu |
| R-07 | User mất thiết bị sau khi QR đã đổi | Chốt quy trình hỗ trợ/thu hồi/cấp lại quyền |
| R-08 | Mất mạng khi đang xem/nghe | Hiển thị lỗi, không cam kết offline |
| R-09 | Mô tả Use Case khác mã nguồn | Lập ma trận truy vết UC/API/UI/test và xác minh trước nghiệm thu |

## 14. Ưu tiên triển khai đề xuất

| Mức | Nhóm | Lý do |
|---|---|---|
| P0 | Tài khoản Seller, giao dịch và xác minh thanh toán | Cơ sở cho quy trình cấp quyền |
| P0 | QR một lần, cấp quyền có thời hạn, thu hồi | Bảo vệ truy cập sau thanh toán |
| P0 | Backend authorization và ownership Seller | Ngăn truy cập dữ liệu/giao dịch chéo |
| P1 | POI, bản đồ, nội dung đa ngôn ngữ và audio online | Trải nghiệm User cốt lõi |
| P1 | Báo cáo Seller về doanh thu/giao dịch/usage | Theo dõi hiệu quả bán và sử dụng |
| P1 | Audit Log cho thanh toán/QR/RBAC | Truy vết sự cố và sai lệch |
| P2 | Analytics toàn hệ thống và báo cáo nâng cao | Phụ thuộc định nghĩa metric và dữ liệu đủ tin cậy |

## 15. Ma trận truy vết

| Mục tiêu | Use Case liên quan |
|---|---|
| BO-01 — Truy cập User qua QR | UC02–UC06 |
| BO-02 — Bán/cấp quyền | UC09, UC12, UC02 |
| BO-03 — Chống tái sử dụng QR | UC12, UC02, UC15 |
| BO-04 — Khám phá POI | UC03, UC04, UC07 |
| BO-05 — Thuyết minh | UC05, UC06, UC07, UC08 |
| BO-06 — Quản trị Seller/Admin | UC09, UC10, UC11 |
| BO-07 — Báo cáo Seller | UC12, UC13 |
| BO-08 — Analytics/Audit | UC14, UC15 |
| BO-09 — Online-only | UC01–UC08, UC12–UC14 |

## 16. Phê duyệt

| Vai trò | Người phê duyệt | Trạng thái | Ngày |
|---|---|---|---|
| Chủ sản phẩm/đại diện nghiệp vụ | TBD | Chưa phê duyệt | TBD |
| Đại diện kỹ thuật | TBD | Chưa phê duyệt | TBD |
| Đại diện kiểm thử/nghiệm thu | TBD | Chưa phê duyệt | TBD |

## Lịch sử phiên bản

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 1.0 | 2026-10-20 | BRD dự thảo dựa trên Use Case trước đây |
| 2.0 | 2026-10-20 | Bỏ tài khoản Tourist và offline; bổ sung Seller, thanh toán, QR dùng một lần, quyền có thời hạn và báo cáo Seller |

## 17. Quyết định demo đã xác nhận (2026-10-20)

- **Thanh toán:** UC12 ngoài MVP. VNPAY Sandbox chỉ là phương án tham khảo nếu tích hợp được duyệt trong tương lai; các yêu cầu xác minh chữ ký, trạng thái, số tiền, mã tham chiếu và idempotency sẽ áp dụng khi đó.
- **Gói dịch vụ:** mô hình dữ liệu/cấu hình phải mở rộng được. `DEMO_24H` (1 VND/24 giờ kể từ lúc kích hoạt thành công) là cấu hình demo tham khảo, không phải luồng bán gói trong MVP; điều kiện thực tế do Seller/chủ sản phẩm quyết định khi UC12 được đưa vào phạm vi.
- **Hủy/hoàn tiền:** cho phép hủy trước khi QR được đổi; chưa hỗ trợ hoàn tiền sau kích hoạt. Giao dịch sai lệch phải được đưa vào trạng thái cần kiểm tra, không tự động xác nhận.
- **QR/grant:** QR chỉ đổi một lần; thao tác đổi phải nguyên tử. Grant gắn với thiết bị đã kích hoạt, có `activated_at` và `expires_at`; phiên có thể được khôi phục trên cùng thiết bị trong thời hạn. Mọi API User yêu cầu grant hợp lệ ở backend, ngoại trừ luồng cần thiết để xem/đổi QR và xử lý lỗi. Trình duyệt web không chứng minh được danh tính thiết bị vật lý tuyệt đối.
- **Ngôn ngữ/POI:** chỉ hỗ trợ `vi` và `en`; UI locale và audio locale độc lập; fallback hiển thị nhãn ngôn ngữ. Publish POI yêu cầu nội dung tiếng Anh hợp lệ và audio tiếng Anh hiện hành khớp phiên bản nội dung.
- **Ảnh:** tối đa 6 ảnh/POI, có sắp xếp và gallery.
- **RBAC:** hai role cố định `ADMIN` và `SUPER_ADMIN`; RBAC động để giai đoạn sau.
- **Auto narration:** chỉ chạy khi tab hoạt động và trình duyệt cho phép Geolocation/phát audio.
- **Analytics MVP:** tổng giao dịch theo trạng thái; thanh toán thành công; doanh thu đã xác nhận; QR tạo/đổi; grant đang hiệu lực/hết hạn; lượt xem POI; lượt phát audio; POI được quan tâm; tỷ lệ POI có English content/audio hiện hành; lỗi thanh toán, redeem và audio; thời điểm cập nhật dữ liệu. Mỗi metric cần định nghĩa công thức, nguồn, múi giờ, deduplication và độ trễ.
- **Audit Log:** ghi login outcome, thay đổi POI/publish, trạng thái audio, giao dịch/thanh toán/hủy, tạo/đổi/thu hồi QR, cấp/từ chối grant, thay đổi Seller/Admin/RBAC và cấu hình bảo mật. Không ghi password, secret, credential hoặc token QR dạng rõ. Retention, chống sửa đổi và hành vi khi kho log lỗi cần được chốt trước production.
- **NFR mục tiêu đề xuất, chưa đo kiểm:** API thường P95 < 500 ms; redeem QR + grant P95 < 1 giây không tính độ trễ hệ thống ngoài; trang User chính tải < 3 giây trong điều kiện test xác định; khả dụng tham khảo 99,5%/tháng; RPO ≤ 24 giờ và RTO ≤ 8 giờ nếu triển khai backup/restore. Phải có kiểm thử concurrency, callback idempotency, authorization/IDOR, replay và expiry.
- **Phạm vi trạng thái:** nội dung trên là quyết định/đích nghiệp vụ. Không coi là bằng chứng endpoint, schema hoặc tích hợp đã được triển khai. Các chỉ tiêu định lượng chỉ được báo đạt sau khi có kết quả đo và điều kiện chạy rõ ràng.

### Ma trận quyết định

| ID | Quyết định | Trạng thái / ghi chú |
|---|---|---|
| DEC-01 | Publish POI cần English content hợp lệ và audio tiếng Anh hiện hành | Đã chốt; cần kiểm thử version consistency |
| DEC-02 | Phải redeem QR trước khi dùng API User yêu cầu quyền | Đã chốt; kiểm tra backend, ngoại lệ chỉ cho luồng xem/redeem QR và lỗi |
| DEC-03 | Gói demo ban đầu `DEMO_24H`, giá 1 VND/24 giờ từ lúc redeem; mô hình gói phải mở rộng được | Định hướng thiết kế; UC12 ngoài MVP, điều kiện thương mại do Seller/chủ sản phẩm quyết định |
| DEC-04 | Thanh toán tự động | Ngoài MVP; VNPAY Sandbox chỉ là phương án tham khảo cho giai đoạn sau, không phải phạm vi triển khai hiện tại |
| DEC-05 | Chính sách hủy/hoàn tiền | Ngoài MVP; Seller/chủ sản phẩm quyết định khi triển khai UC12 |
| DEC-06 | QR một lần; grant gắn với thiết bị đã kích hoạt | Đã chốt; không hỗ trợ chuyển thiết bị hoặc khôi phục grant sang thiết bị khác |
| DEC-07 | Hai role cố định `ADMIN`/`SUPER_ADMIN` | Đã chốt; RBAC động để sau |
| DEC-08 | MVP chỉ bật `vi`/`en`; UI locale/audio locale độc lập; fallback có nhãn | Đã chốt; mô hình dữ liệu/cấu hình phải mở rộng locale mà không đổi logic lõi |
| DEC-09 | Auto narration chỉ khi tab hoạt động và trình duyệt cho phép | Đã chốt; cần test quyền vị trí/autoplay |
| DEC-10 | Tối đa 6 ảnh/POI, có sắp xếp/gallery | Đã chốt |
| DEC-11 | Analytics MVP theo bộ metric đã đề xuất | Phạm vi chấp thuận; công thức/nguồn/timezone/deduplication cần đặc tả |
| DEC-12 | Audit Log theo danh mục sự kiện và phân tích rủi ro | Cơ sở chấp thuận; retention/tamper protection/failure policy cần đặc tả |
| DEC-13 | NFR theo mục tiêu định lượng trong BRD | Cơ sở chấp thuận; tất cả mục tiêu chưa đo kiểm |

## 18. Quyết định bổ sung về phạm vi và dữ liệu

- UC08 (Giám sát tiến độ tạo Audio) và UC12 (Quản lý thanh toán/tạo QR) không thực hiện trong MVP. UC12 không cung cấp luồng thanh toán/QR nội bộ trong MVP; theo quy tắc nghiệp vụ đích, Seller tạo và cấp QR riêng cho từng khách hàng sau khi thanh toán thành công. QR không tự hết hạn trước khi kích hoạt.
- UC02 vẫn mô tả việc redeem QR được cung cấp ngoài hệ thống: QR dùng một lần; không tự hết hạn trước lần kích hoạt đầu tiên nhưng Seller có thể thu hồi; grant bắt đầu thời hạn 24 giờ kể từ lúc kích hoạt thành công theo cấu hình demo hiện tại.
- Gói dịch vụ phải được mô hình hóa bằng dữ liệu/cấu hình mở rộng được; không hard-code `DEMO_24H` vào business logic. Điều kiện giá/thời lượng thực tế khi UC12 được triển khai phải được chốt lại.
- Soft delete áp dụng toàn hệ thống cho thực thể nghiệp vụ có thể xóa; giữ lịch sử, quan hệ và audit. Audit log append-only, không xóa qua luồng nghiệp vụ thông thường.