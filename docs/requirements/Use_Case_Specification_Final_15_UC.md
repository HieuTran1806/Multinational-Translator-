# ĐẶC TẢ CA SỬ DỤNG — MULTITIONAL-TRANSLATOR-

> **Quyết định quyền mới nhất (2026-10-29):** Xem [kế hoạch chuẩn hóa ma trận quyền và loại bỏ Seller](../planning/role-matrix-seller-removal-plan.md). Seller/UC09 và báo cáo Seller/UC13 bị loại bỏ; Analytics chỉ Admin; Super Admin chỉ quản lý tài khoản Admin và xem Audit Log; UC12 chỉ quản lý QR hiện có, không triển khai thanh toán. Ma trận quyền dưới đây là yêu cầu hiện hành; UC09/UC13 được giữ số thứ tự để bảo toàn traceability nhưng đã loại bỏ.

## Danh sách ca sử dụng

| ID | Ca sử dụng | Tác nhân |
|---|---|---|
| UC01 | Chọn / Chuyển đổi ngôn ngữ | User |
| UC02 | Quét QR và kích hoạt quyền truy cập User | User |
| UC03 | Khám phá bản đồ tương tác | User |
| UC04 | Xem chi tiết POI | User |
| UC05 | Nghe thuyết minh POI | User |
| UC06 | Nhận thuyết minh tự động theo vị trí | User |
| UC07 | Quản lý POI, bản dịch và media | Admin |
| UC08 | Giám sát tiến độ tạo Audio | Admin |
| UC10 | Quản lý tài khoản Admin | Super Admin |
| UC11 | RBAC động — ngoài phạm vi, không triển khai | Không áp dụng |
| UC12 | Quản lý QR theo chức năng hiện có; không thanh toán | Admin |
| UC13 | Đã loại bỏ — không còn báo cáo Seller | Không áp dụng |
| UC14 | Xem Analytics toàn hệ thống | Admin |
| UC15 | Xem Audit Log | Super Admin |


## Ma trận quyền hiện hành

| Quyền | User | Admin | Super Admin |
|---|---:|---:|---:|
| Kích hoạt QR hợp lệ / xem nội dung theo grant | Có | Không thay User | Không |
| POI, bản dịch, media/audio, QR quản trị | Không | Có | 403 |
| Analytics toàn hệ thống | Không | Có | 403 |
| Tạo/xem/sửa/khóa/reset/xóa mềm tài khoản Admin | Không | 403 | Có |
| Xem Audit Log | Không | 403 | Có |
| Seller, payment/order, Seller report, dynamic RBAC | Không tồn tại | Không tồn tại | Không tồn tại |
## Quy ước và thuật ngữ

- **User:** khách truy cập các tính năng tham quan sau khi quét và kích hoạt QR hợp lệ. User không cần đăng ký, đăng nhập hoặc đăng xuất bằng tài khoản cá nhân.
- **Seller:** đã loại bỏ; không có account, session, API, UI, báo cáo hoặc dữ liệu riêng.
- **QR truy cập:** mã dùng một lần do Admin tạo theo UC12; User redeem để nhận grant theo UC02. Không gắn với giao dịch hoặc thanh toán.
- **Chỉ hoạt động trực tuyến (chỉ hoạt động trực tuyến):** các trang và chức năng nghiệp vụ yêu cầu kết nối mạng. Khi mất mạng, hệ thống hiển thị trạng thái mất kết nối và cho phép thử lại; không cam kết tiếp tục sử dụng bằng tài nguyên ngoại tuyến.
- Các chi tiết chưa được chủ sản phẩm quyết định được ghi **TBD**, không được xem là quyết định đã phê duyệt.

---

# UC01 — CHỌN / CHUYỂN ĐỔI NGÔN NGỮ

### 1. Mã ca sử dụng
**UC01**

### 2. Tên ca sử dụng
**Chọn / Chuyển đổi ngôn ngữ**

### 3. Tác nhân
**User**

### 4. Tóm tắt
User chọn ngôn ngữ giao diện và nội dung POI trong ứng dụng User.

### 5. Điều kiện tiên quyết
- Website truy cập được và API/tài nguyên ngôn ngữ khả dụng.
- User đã kích hoạt quyền truy cập hợp lệ qua UC02 khi tính năng yêu cầu quyền.

### 6. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User mở lựa chọn ngôn ngữ hoặc chọn đổi ngôn ngữ. | Hệ thống hiển thị danh sách ngôn ngữ được hỗ trợ. |
| 2 | User chọn ngôn ngữ đích. | Hệ thống tải tài nguyên giao diện và nội dung POI tương ứng qua mạng. **[E1, E2]** |
| 3 | — | Hệ thống kiểm tra tài nguyên cần thiết và quy tắc fallback. **[A1, A2]** |
| 4 | — | Khi tài nguyên cần thiết sẵn sàng, hệ thống áp dụng ngôn ngữ và cập nhật giao diện/nội dung. |
| 5 | — | User tiếp tục sử dụng ứng dụng User bằng ngôn ngữ mới. |

### 7. Luồng thay thế
- **A1 — Ngôn ngữ đã được áp dụng:** hệ thống dùng tài nguyên hiện có trong phiên và không tải lại không cần thiết.
- **A2 — Bản dịch nội dung POI chưa đầy đủ:** hệ thống hiển thị nội dung khả dụng cùng thông báo thiếu bản dịch theo quy tắc fallback đã thống nhất.
### 8. Luồng ngoại lệ
- **E1 — Không tải được tài nguyên ngôn ngữ:** giữ ngôn ngữ hiện tại, thông báo lỗi và cho phép thử lại.
- **E2 — Mất mạng:** hiển thị trạng thái mất kết nối; không hứa hẹn chức năng offline.
### 9. Sự kiện kích hoạt
User muốn chọn hoặc đổi ngôn ngữ.

### 10. Quy tắc nghiệp vụ
- UI locale, POI content locale và audio locale là các khái niệm riêng; quy tắc liên kết/fallback phải nhất quán.
- MVP chỉ bật `vi` và `en`; danh sách locale lấy từ dữ liệu/cấu hình `language`, không hard-code thành enum/nhánh xử lý cố định. Thêm ngôn ngữ mới phải thực hiện qua cấu hình/dữ liệu và bổ sung tài nguyên, bản dịch, audio tương ứng.

### 11. Điều kiện hậu
- Thành công: ngôn ngữ được chọn áp dụng nhất quán theo tài nguyên sẵn sàng.
- Thất bại: giữ ngôn ngữ trước đó.

---

# UC02 — QUÉT QR VÀ KÍCH HOẠT QUYỀN TRUY CẬP USER

### 1. Mã ca sử dụng
**UC02**

### 2. Tên ca sử dụng
**Quét QR và kích hoạt quyền truy cập User**

### 3. Tác nhân
**User**; dịch vụ backend là tác nhân hỗ trợ.

### 4. Tóm tắt
User quét QR riêng cho khách hàng để kích hoạt quyền. QR chỉ kích hoạt một lần và quyền gắn với thiết bị đã kích hoạt. Hệ thống xác minh QR dùng một lần và trạng thái thu hồi; nếu hợp lệ, cấp quyền User trong 24 giờ kể từ lúc kích hoạt thành công. Không quản lý giao dịch/thanh toán; QR được Admin quản lý theo UC12. Không yêu cầu tài khoản Tourist.

### 5. Điều kiện tiên quyết
- Website và backend đang truy cập được.
- Mỗi khách hàng có QR riêng. Admin tạo và quản lý QR theo API hiện có; User kích hoạt QR hợp lệ để nhận grant. Không có thanh toán hoặc Seller.
- QR chưa được sử dụng và chưa bị thu hồi; hành vi hết hạn/thu hồi theo API hiện hành.
- Thời lượng quyền demo hiện tại là 24 giờ kể từ lúc kích hoạt thành công; thời lượng phải được lấy từ cấu hình để hỗ trợ gói khác trong tương lai.

### 6. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User mở ứng dụng User và chọn quét QR hoặc mở QR link bằng camera/thiết bị hỗ trợ. | Website hiển thị hướng dẫn quét/mở QR. |
| 2 | User quét QR hoặc mở URL được mã hóa trong QR. | Hệ thống nhận token QR; không tin cậy dữ liệu quyền truy cập chỉ dựa trên nội dung hiển thị trong QR. **[A2]** |
| 3 | — | Backend kiểm tra token, trạng thái thu hồi và trạng thái chưa sử dụng của QR; không có bước xác minh thanh toán; UC12 chỉ quản lý QR Admin. **[A1, E1, E3, E4, E5]** |
| 4 | — | Nếu hợp lệ, backend nguyên tử đánh dấu QR đã sử dụng và tạo phiên/quyền truy cập có thời hạn. **[E2, E6]** |
| 5 | — | Hệ thống hiển thị xác nhận kích hoạt thành công và mở chức năng User được cấp quyền. |
| 6 | User chọn bản đồ, POI hoặc audio. | Hệ thống cho phép truy cập trong phạm vi và thời hạn đã cấp. |

### 7. Luồng thay thế
- **A1 — User đã có phiên quyền truy cập còn hiệu lực trên thiết bị đã kích hoạt:** hệ thống tiếp tục phiên đó; QR mới vẫn tuân theo quy tắc dùng một lần nếu được gửi để đổi.
- **A2 — QR được mở qua liên kết thay vì camera:** ứng dụng User xử lý URL/token theo cùng quy tắc xác minh như quét camera.
### 8. Luồng ngoại lệ
- **E1 — QR không hợp lệ hoặc bị sửa đổi:** từ chối kích hoạt, không cấp quyền và hiển thị thông báo chung.
- **E2 — QR đã được sử dụng:** từ chối dùng lại; hướng dẫn liên hệ đơn vị vận hành nếu cần hỗ trợ. Không tự cấp quyền cho thiết bị khác.
- **E3 — Token QR bị thu hồi hoặc không hợp lệ:** không cấp quyền. Không có nghiệp vụ thanh toán trong hệ thống hiện hành.
- **E4 — QR bị thu hồi hoặc quyền/gói không còn hợp lệ:** từ chối kích hoạt. QR chưa kích hoạt không tự hết hạn; QR bị thu hồi hoặc không hợp lệ phải bị từ chối. Quyền sau kích hoạt có thời hạn theo gói đã áp dụng.
- **E5 — Mất mạng/backend không phản hồi:** không cấp quyền khi chưa xác minh được; cho phép thử lại khi kết nối phục hồi.
- **E6 — Lỗi ghi nhận dùng một lần:** giao dịch kích hoạt phải có tính nguyên tử để tránh hai thiết bị cùng đổi một QR thành công.
### 9. Sự kiện kích hoạt
User có QR truy cập và muốn kích hoạt quyền tham quan. QR được Admin tạo theo UC12 hiện hành.

### 10. Quy tắc nghiệp vụ
- QR có thể được quét/đổi **một lần**; quyền truy cập sau đó duy trì theo thời hạn gói/dịch vụ.
- QR cấp quyền sử dụng **các chức năng User trong phạm vi dịch vụ**, không tự động cấp quyền quản trị.
- Token QR phải khó đoán, không chứa dữ liệu nhạy cảm dạng rõ, có thể bị thu hồi và không được ghi nguyên văn vào log.
- QR có thể bị thu hồi theo API quản trị hiện hành. Quyền truy cập có thời hạn 24 giờ kể từ khi kích hoạt thành công theo cấu hình demo; kiến trúc phải cho phép cấu hình thời lượng gói trong tương lai.
- Grant gắn với thiết bị đã kích hoạt và có hiệu lực 24 giờ. Khi ứng dụng đóng/mở lại, phiên chỉ được khôi phục trên cùng thiết bị trong thời hạn; không hỗ trợ chuyển thiết bị hoặc khôi phục grant sang thiết bị khác.

### 11. Điều kiện hậu
- Thành công: QR được đánh dấu đã đổi; phiên/quyền User được cấp đến thời điểm hết hạn.
- Thất bại: không cấp quyền và không đánh dấu QR đã đổi nếu lỗi xảy ra trước khi giao dịch đổi QR được commit.

---

# UC03 — KHÁM PHÁ BẢN ĐỒ TƯƠNG TÁC

### 1. Mã ca sử dụng
**UC03**

### 2. Tác nhân
**User**

### 3. Tóm tắt
User xem bản đồ trực tuyến, khám phá POI, phóng to/thu nhỏ và chọn POI để xem chi tiết.

### 4. Điều kiện tiên quyết
- Website có kết nối mạng.
- User có quyền truy cập hợp lệ nếu bản đồ thuộc tính năng được bảo vệ.
- Dịch vụ bản đồ và dữ liệu POI khả dụng.

### 5. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User mở bản đồ. | Hệ thống tải bản đồ và dữ liệu POI từ dịch vụ trực tuyến. **[E1, E3]** |
| 2 | — | Hệ thống hiển thị POI trên bản đồ; có thể gom nhóm marker khi phù hợp. **[E2]** |
| 3 | User pan/zoom hoặc yêu cầu định vị. | Hệ thống cập nhật viewport hoặc yêu cầu quyền Geolocation của trình duyệt. **[A1, E3]** |
| 4 | User chọn POI hoặc chọn POI trong cụm marker. | Hệ thống xác định POI và mở UC04. **[A2]** |

### 6. Luồng thay thế
- **A1 — Từ chối quyền vị trí:** bản đồ vẫn có thể được khám phá bằng tâm bản đồ hiện tại/mặc định.
- **A2 — Chọn cụm marker:** hệ thống hiển thị các POI trong cụm để User chọn.
### 7. Luồng ngoại lệ
- **E1 — Dịch vụ bản đồ không khả dụng:** hiển thị lỗi và thao tác thử lại; không chuyển sang offline map.
- **E2 — API POI lỗi:** thông báo POI không tải được; cho phép thử lại.
- **E3 — Mất mạng:** thông báo ứng dụng User cần kết nối mạng; các chức năng phụ thuộc mạng không được cam kết hoạt động.
### 8. Sự kiện kích hoạt
User muốn khám phá địa điểm tham quan.

### 9. Điều kiện hậu
POI được chọn làm đầu vào cho UC04; không thay đổi dữ liệu nghiệp vụ.

---

# UC04 — XEM CHI TIẾT POI

### 1. Mã ca sử dụng
**UC04**

### 2. Tác nhân
**User**

### 3. Tóm tắt
Hiển thị nội dung, bản dịch, hình ảnh và thông tin liên quan của một POI đang được công khai.

### 4. Điều kiện tiên quyết
- Website có kết nối mạng và quyền truy cập còn hiệu lực khi được yêu cầu.
- POI tồn tại và được phép công khai.

### 5. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User chọn POI từ bản đồ/danh sách. | Hệ thống tải chi tiết POI và nội dung theo locale hiện tại. **[E1, E3]** |
| 2 | — | Hệ thống tải hình ảnh và metadata khả dụng. **[E2]** |
| 3 | — | Hệ thống hiển thị tên, mô tả, thông tin vị trí, hình ảnh và các ngôn ngữ/audio khả dụng. **[A1, A2]** |
| 4 | User chọn nghe thuyết minh. | Hệ thống chuyển sang UC05 với POI đã chọn. |

### 6. Luồng thay thế
- **A1 — Thiếu bản dịch:** hiển thị nội dung theo fallback đã công bố và thông báo ngôn ngữ đích chưa đầy đủ.
- **A2 — POI không có audio:** vẫn hiển thị chi tiết và thông báo audio không khả dụng.
### 7. Luồng ngoại lệ
- **E1 — POI bị ẩn/xóa hoặc không còn quyền truy cập:** hiển thị thông báo và quay về bản đồ.
- **E2 — Không tải được ảnh/nội dung:** hiển thị trạng thái lỗi cho phần tài nguyên tương ứng và cho phép thử lại.
- **E3 — Mất mạng:** hiển thị trạng thái mất kết nối; không sử dụng gói offline.
### 8. Sự kiện kích hoạt
User muốn tìm hiểu một POI.

### 9. Điều kiện hậu
Chi tiết POI được hiển thị nếu tài nguyên hợp lệ; không thay đổi POI.

---

# UC05 — NGHE THUYẾT MINH POI

### 1. Mã ca sử dụng
**UC05**

### 2. Tác nhân
**User**

### 3. Tóm tắt
User chủ động phát âm thanh thuyết minh cho POI theo ngôn ngữ audio khả dụng.

### 4. Điều kiện tiên quyết
- User có quyền truy cập hợp lệ khi chức năng yêu cầu.
- POI công khai và audio tương ứng tồn tại.
- Kết nối mạng khả dụng.

### 5. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User chọn Play trên chi tiết POI. | Hệ thống xác định audio phù hợp với POI/ngôn ngữ đã chọn. **[A1, E1, E4]** |
| 2 | — | Hệ thống yêu cầu tài nguyên audio trực tuyến và khởi tạo trình phát. **[A2, E2, E3]** |
| 3 | User điều khiển phát/tạm dừng/tiếp tục/dừng. | Trình phát cập nhật trạng thái và tiến độ. **[E3]** |
| 4 | — | Hệ thống báo trạng thái hoàn tất hoặc lỗi. **[E2]** |

### 6. Luồng thay thế
- **A1 — Có nhiều audio locale:** User chọn một ngôn ngữ khả dụng.
- **A2 — Có transcript nhưng không có audio:** hiển thị transcript nếu dữ liệu có sẵn; không báo rằng audio đã phát.
### 7. Luồng ngoại lệ
- **E1 — Audio không tồn tại:** thông báo rõ và không khởi tạo phát.
- **E2 — Tải/phát thất bại:** hiển thị lỗi và cho phép thử lại.
- **E3 — Mất mạng:** dừng/không thể tiếp tục tải audio; không chuyển sang nguồn offline.
- **E4 — Quyền truy cập hết hạn:** từ chối yêu cầu mới và yêu cầu User kích hoạt quyền hợp lệ.
### 8. Sự kiện kích hoạt
User chọn nghe audio từ chi tiết POI.

### 9. Điều kiện hậu
Trạng thái phát được phản ánh chính xác; sự kiện phát được ghi nhận cho thống kê theo quy tắc dữ liệu.

---

# UC06 — NHẬN THUYẾT MINH TỰ ĐỘNG THEO VỊ TRÍ

### 1. Mã ca sử dụng
**UC06**

### 2. Tác nhân
**User**

### 3. Tóm tắt
Ứng dụng User có thể phát thuyết minh tự động khi vị trí User đáp ứng điều kiện geofence và User đã cho phép định vị cũng như bật tính năng.

### 4. Điều kiện tiên quyết
- User có quyền truy cập hợp lệ và kết nối mạng.
- Trình duyệt hỗ trợ Geolocation và User đã cấp quyền.
- Tính năng tự động được User bật.
- POI có audio khả dụng.

### 5. Luồng sự kiện chính
1. User bật thuyết minh tự động.
2. Hệ thống yêu cầu quyền vị trí và nhận tọa độ/độ chính xác. **[E1, E4]**
3. Hệ thống kiểm tra geofence, chất lượng vị trí, debounce và cooldown theo cấu hình. **[A1, E2]**
4. Nếu điều kiện đạt, hệ thống chọn POI theo chính sách ưu tiên. **[A1]**
5. Hệ thống tải và phát âm thanh; trạng thái hiển thị cho User. **[A2, E3]**

### 6. Luồng thay thế
- **A1 — Nhiều POI trong vùng:** chọn theo chính sách ưu tiên đã xác nhận.
- **A2 — Audio khác đang phát:** áp dụng chính sách không chồng âm thanh đã xác nhận.
### 7. Luồng ngoại lệ
- **E1 — Không cấp quyền vị trí:** không tự động phát; User vẫn có thể dùng bản đồ và phát thủ công nếu được cấp quyền.
- **E2 — GPS không đủ chính xác:** không kích hoạt và chờ cập nhật vị trí.
- **E3 — Audio không khả dụng/mất mạng:** không báo phát thành công; thông báo lỗi.
- **E4 — Trình duyệt hạn chế Geolocation nền:** giải thích tính năng chỉ hoạt động khi ứng dụng User/trình duyệt cho phép theo dõi vị trí.
### 8. Quy tắc nghiệp vụ
- Geofence, debounce và cooldown phải là cấu hình, không hard-code. Giá trị mặc định đề xuất cho MVP: bán kính 100 m, vị trí phải ổn định ít nhất 10 giây (debounce), cooldown 10 phút cho cùng POI; điều chỉnh sau kiểm thử thực địa và ghi nhận trong cấu hình môi trường.
- Trình duyệt web có thể giới hạn định vị nền; không cam kết auto narration khi tab đóng hoặc thiết bị khóa.

### 9. Điều kiện hậu
Sự kiện auto narration được ghi nhận khi đủ điều kiện; User có thể tắt tính năng.

---

# UC07 — QUẢN LÝ POI, BẢN DỊCH VÀ MEDIA

### 1. Mã ca sử dụng
**UC07**

### 2. Tác nhân
**Admin**

### 3. Tóm tắt
Admin tạo, xem, chỉnh sửa, ẩn/xóa và quản lý nội dung POI, bản dịch, hình ảnh và liên kết audio theo quyền được cấp.

### 4. Điều kiện tiên quyết
- Admin có phiên quản trị hợp lệ và quyền phù hợp.
- Dịch vụ lưu trữ và backend khả dụng.

### 5. Luồng sự kiện chính
1. Admin mở khu vực quản lý POI.
2. Hệ thống hiển thị danh sách có tìm kiếm/lọc/phân trang theo khả năng được hỗ trợ. **[E4]**
3. Admin tạo hoặc chọn POI để xem/sửa. **[E1]**
4. Admin nhập nội dung, vị trí, bản dịch và media. **[A2, E1]**
5. Hệ thống kiểm tra dữ liệu, quyền và điều kiện công khai. **[A3, E1, E3, E4]**
6. Hệ thống lưu thay đổi, cập nhật trạng thái và hiển thị kết quả. **[A1, A3, E2]**

### 6. Luồng thay thế
- **A1 — Lưu bản nháp:** POI được lưu nhưng chưa công khai.
- **A2 — Quản lý media:** Admin thêm/thay/xóa ảnh hoặc liên kết audio được hỗ trợ.
- **A3 — Công khai POI:** chỉ cho phép khi đạt readiness rules đã được chốt.
### 7. Luồng ngoại lệ
- **E1 — Dữ liệu không hợp lệ**: báo lỗi theo trường, không lưu trạng thái không hợp lệ.
- **E2 — POI bị thay đổi đồng thời**: thông báo xung đột và yêu cầu tải lại.
- **E3 — Upload/lưu media thất bại**: giữ trạng thái an toàn, không đánh dấu tài nguyên chưa lưu là sẵn sàng.
- **E4 — Không có quyền**: từ chối thao tác phía backend.
### 8. Điều kiện hậu
Thay đổi hợp lệ được lưu và phản ánh trong dữ liệu công khai theo trạng thái POI.

---

# UC08 — GIÁM SÁT TIẾN ĐỘ TẠO AUDIO

> **Phạm vi:** KHÔNG THỰC HIỆN TRONG MVP. Phần dưới là mô tả tham chiếu cho giai đoạn sau, không phải tiêu chí nghiệm thu MVP.

### 1. Mã ca sử dụng
**UC08**

### 2. Tác nhân
**Admin**

### 3. Tóm tắt
Admin theo dõi trạng thái tác vụ tạo/xử lý audio và xem kết quả/lỗi.

### 4. Điều kiện tiên quyết
- Admin có quyền quản trị phù hợp.
- Audio task service khả dụng.

### 5. Luồng sự kiện chính
1. Admin mở trang tác vụ audio.
2. Hệ thống truy xuất các tác vụ và trạng thái. **[E1, E3]**
3. Hệ thống hiển thị trạng thái/tiến độ/kết quả/lỗi được hỗ trợ. **[A1, E2]**
4. Admin chọn một tác vụ để xem thông tin chi tiết. **[E3]**
5. Hệ thống cập nhật trạng thái theo cơ chế được triển khai. **[A2, E1]**

### 6. Luồng thay thế
- **A1 — Lọc theo trạng thái hoặc POI nếu giao diện hỗ trợ.**
- **A2 — Thử tải lại danh sách khi trạng thái mới chưa được cập nhật.**
### 7. Luồng ngoại lệ
- **E1 — Nguồn tác vụ không khả dụng**: hiển thị lỗi, cho phép thử lại.
- **E2 — Tác vụ thất bại**: hiển thị lỗi và không đánh dấu audio sẵn sàng.
- **E3 — Quyền không đủ**: từ chối truy cập.
### 8. Quy tắc nghiệp vụ
- Pause/Resume/Cancel không thuộc MVP; nếu triển khai ở giai đoạn sau, cần xác định riêng theo khả năng của backend/job runner.
- Không dùng offline task queue cho User-facing ứng dụng User.

### 9. Điều kiện hậu
Admin xem được trạng thái tác vụ; thao tác xem không tự thay đổi trạng thái tác vụ.

---

# UC09 — ĐÃ LOẠI BỎ: QUẢN LÝ SELLER

**Trạng thái:** Không thuộc nghiệp vụ hiện hành. Role, tài khoản, API, giao diện, báo cáo và dữ liệu riêng Seller được loại bỏ. Không tạo endpoint thay thế.
# UC10 — QUẢN LÝ TÀI KHOẢN ADMIN

**Actor:** Super Admin. **Tiền điều kiện:** đã đăng nhập bằng session hợp lệ và có role `SUPER_ADMIN`.

## Mục tiêu
Super Admin tạo, xem danh sách/chi tiết, sửa thông tin, khóa/mở khóa, reset mật khẩu và xóa mềm tài khoản `ADMIN`.

## Luồng chính
1. Super Admin mở `/accounts`; backend trả về danh sách Admin còn hiệu lực, hỗ trợ tìm kiếm và phân trang.
2. Super Admin tạo tài khoản với username, mật khẩu và tên hiển thị tùy chọn. Backend cố định role là `ADMIN`, hash mật khẩu và ghi audit.
3. Super Admin xem chi tiết một Admin, cập nhật tên hiển thị hoặc trạng thái enabled.
4. Super Admin reset mật khẩu; backend lưu hash, giữ secret khỏi response/log và ghi audit.
5. Super Admin xóa mềm Admin; tài khoản không thể đăng nhập hoặc dùng session mới, lịch sử được giữ.

## Quy tắc và lỗi
- Tất cả API `/api/v1/admin/accounts/**` chỉ dành cho `SUPER_ADMIN`; service kiểm tra lại actor.
- UC10 chỉ quản lý tài khoản có role `ADMIN`; không tạo, sửa, khóa, reset hoặc xóa tài khoản Super Admin. Không có role editor.
- Username trùng trả 409; dữ liệu không hợp lệ trả 400; tài khoản không tồn tại/đã xóa mềm trả 404; actor không đủ quyền trả 403.
- Không cho Admin tự nâng quyền; không thêm profile hoặc self-service đổi mật khẩu.
# UC11 — PHÂN QUYỀN TĨNH (KHÔNG CÓ PERMISSION EDITOR)

**Trạng thái:** Chính sách role tĩnh được thực thi ở backend; không triển khai CRUD role, permission matrix động hoặc giao diện chỉnh quyền.

- `ADMIN`: POI, bản dịch, media/audio, QR và Analytics toàn hệ thống.
- `SUPER_ADMIN`: tài khoản Admin và Audit Log.
- User truy cập nội dung qua grant QR; không được cấp quyền quản trị.
- `SELLER` không còn là role hợp lệ. Mọi route không được khai báo bị từ chối; matcher cụ thể phải đứng trước `/api/v1/admin/**`.
# UC12 — QUẢN LÝ QR TRUY CẬP (PHẠM VI HIỆN HÀNH)

**Actor:** Admin. **Trạng thái:** Chức năng QR hiện có; không bao gồm giao dịch, thanh toán, đơn hàng hoặc Seller.

## Mục tiêu
Admin tạo QR truy cập một lần cho khách, xem trạng thái và thu hồi QR theo API hiện có. User chỉ nhận grant sau khi kích hoạt QR hợp lệ theo UC02.

## Luồng chính
1. Admin mở mục QR truy cập.
2. Admin tạo QR với ghi chú tùy chọn và gói đã được cấu hình.
3. Backend lưu token hash, trả token rõ một lần và ghi audit event.
4. Admin xem trạng thái QR và có thể thu hồi QR theo quyền hiện có.
5. User kích hoạt QR hợp lệ; backend tạo grant theo luồng UC02.

## Quy tắc và lỗi
- Chỉ `ADMIN` được gọi API quản trị QR; `SUPER_ADMIN` bị từ chối.
- QR chỉ dùng một lần; grant và thời hạn tuân theo cấu hình và quy tắc hiện hành.
- QR đã dùng/đã thu hồi/không hợp lệ không thể kích hoạt lại.
- Không có gán QR cho Seller, nghiệp vụ thanh toán hoặc đơn hàng.
# UC13 — ĐÃ LOẠI BỎ: BÁO CÁO SELLER

**Trạng thái:** Không thuộc nghiệp vụ hiện hành. Không còn Seller-scoped analytics, báo cáo doanh thu/giao dịch Seller hoặc endpoint `/api/v1/seller/**`. Analytics vận hành toàn hệ thống được mô tả tại UC14 và chỉ dành cho Admin.
# UC14 — XEM ANALYTICS TOÀN HỆ THỐNG

### 1. Mã ca sử dụng
**UC14**

### 2. Tác nhân
**Admin, Super Admin**

### 3. Tóm tắt
Chỉ Admin có quyền xem số liệu vận hành toàn hệ thống. Super Admin bị từ chối ở Analytics.

### 4. Điều kiện tiên quyết
- Actor có phiên quản trị hợp lệ và quyền `analytics:view`.
- Analytics read models khả dụng.

### 5. Luồng sự kiện chính
1. Actor mở Analytics.
2. Hệ thống tải dữ liệu read model và áp dụng phạm vi quyền. **[E1, E2, E3]**
3. Hệ thống hiển thị các metric được thống nhất, có thể gồm lượt xem POI, lượt phát âm thanh, tìm kiếm, POI phổ biến, . **[A1, A2, E3]**
4. Actor chọn date range/filter được hỗ trợ. **[A2, E1]**
5. Hệ thống cập nhật dashboard và hiển thị thời điểm dữ liệu được cập nhật.

### 6. Luồng thay thế
- **A1 — Chưa có dữ liệu**: hiển thị trạng thái rỗng.
- **A2 — Một nguồn metric lỗi**: thông báo rõ metric không tải được, không hiển thị giá trị giả.
### 7. Luồng ngoại lệ
- **E1 — Nguồn dữ liệu Analytics không khả dụng**: báo lỗi và cho phép thử lại.
- **E2 — Actor không có quyền**: từ chối.
- **E3 — Dữ liệu nhạy cảm**: chỉ hiển thị ở mức tổng hợp theo quyền đã cấp.
### 8. Quy tắc nghiệp vụ
- UC14 là Analytics toàn hệ thống chỉ dành cho Admin; UC09 và UC13 đã loại bỏ.
- Metric, công thức, múi giờ, consent, retention và phạm vi lọc phải được định nghĩa thống nhất.
- Dashboard chỉ hỗ trợ xem số liệu tổng hợp và lọc theo ngày/POI/locale phù hợp; không có chức năng xuất báo cáo hoặc drill-down xuất file. Metric định nghĩa tại UC14; timestamp lưu UTC, hiển thị `Asia/Ho_Chi_Minh`, độ trễ mục tiêu tối đa 5 phút, event thô 90 ngày và số liệu tổng hợp 13 tháng.

### 9. Điều kiện hậu
Dashboard được hiển thị theo quyền; thao tác xem không thay đổi dữ liệu nghiệp vụ.

---

# UC15 — XEM AUDIT LOG

### 1. Mã ca sử dụng
**UC15**

### 2. Tác nhân
**Super Admin**

### 3. Tóm tắt
Chỉ Super Admin được tra cứu Audit Log toàn hệ thống, gồm sự kiện quản trị và nghiệp vụ quan trọng. Admin không được xem Audit Log toàn hệ thống.

### 4. Điều kiện tiên quyết
- Super Admin có quyền `audit:read`.
- Audit store khả dụng.

### 5. Luồng sự kiện chính
1. Super Admin mở Audit Log.
2. Hệ thống truy xuất bản ghi theo quyền. **[E1, E3]**
3. Hệ thống hiển thị actor, hành động, tài nguyên, thời điểm, kết quả và metadata an toàn được cho phép. **[E4]**
4. Super Admin tìm kiếm/lọc/sắp xếp/phân trang. **[E2]**
5. Hệ thống hiển thị kết quả. **[E1, E3]**

### 6. Luồng ngoại lệ
- **E1 — Audit store không khả dụng**: hiển thị lỗi và cho phép thử lại.
- **E2 — Không có bản ghi phù hợp**: hiển thị trạng thái rỗng.
- **E3 — Không có quyền**: từ chối.
- **E4 — Không ghi token QR, mật khẩu, credential ngân hàng hoặc dữ liệu nhạy cảm dạng rõ vào log.**
### 7. Quy tắc nghiệp vụ
- Các sự kiện cần audit tối thiểu: tạo/cập nhật/khóa/xóa mềm tài khoản Admin; reset mật khẩu; tạo/thu hồi/kích hoạt QR; thay đổi nội dung/xuất bản; truy cập bị từ chối quan trọng.
- Audit log lưu tối thiểu 24 tháng; chỉ Super Admin được đọc. Bản ghi audit append-only, không cho sửa/xóa qua nghiệp vụ thông thường; áp dụng kiểm soát truy cập, backup hằng ngày và kiểm thử khôi phục định kỳ. Không ghi token QR, mật khẩu, secret hoặc credential dạng rõ. Nếu audit store không khả dụng, thao tác nhạy cảm (reset mật khẩu, redeem/revoke QR, soft delete tài khoản Admin) phải fail-closed; thao tác đọc thông thường được phép tiếp tục và phát cảnh báo.

### 8. Điều kiện hậu
Audit records được hiển thị; thao tác xem không sửa/xóa log.

---

# PHỤ THUỘC / QUAN HỆ

| Nguồn | Quan hệ | Đích | Mục đích |
|---|---|---|---|
| UC01 | language context | UC04–UC06 | Ngôn ngữ ảnh hưởng nội dung POI và audio. |
| UC02 | grants time-bound User access | UC03–UC06 | QR đổi thành công tạo quyền dùng chức năng User trong thời hạn gói. |
| UC03 | selects POI | UC04 | Bản đồ mở chi tiết POI. |
| UC04 | invokes | UC05 | Chi tiết POI cung cấp điểm vào phát âm thanh. |
| UC06 | reuses audio playback | UC05 | Auto narration dùng nguồn audio và quy tắc phát liên quan. |
| UC07 | provides POI/content/media | UC04–UC06 | Admin quản lý nội dung hiển thị và audio. |
| UC07 | may enqueue audio task | UC08 | Thay đổi nội dung có thể tạo tác vụ xử lý audio. |
| UC12 | creates/revokes access QR | UC02, UC14 | QR hợp lệ cấp grant cho User; usage events phục vụ Analytics Admin. |
| UC02 | emits access/usage events | UC14 | Analytics Admin tổng hợp sự kiện sử dụng. |
| UC11 | static role policy | UC07, UC10, UC14, UC15 | Policy tĩnh, deny-by-default; không có dynamic RBAC. |
| UC10, UC12 | generates audit events | UC15 | Các thay đổi quan trọng phải có khả năng truy vết. |

## Các quyết định đã chốt

1. Không yêu cầu Tourist/User đăng ký, đăng nhập hoặc đăng xuất bằng tài khoản cá nhân.
2. Seller account đã loại bỏ; không tồn tại API hoặc luồng quản lý Seller.
3. UC12 chỉ quản lý QR truy cập Admin hiện có; không có thanh toán/đơn hàng.
4. User phải redeem QR hợp lệ trước khi dùng chức năng User yêu cầu grant; kiểm tra quyền ở backend.
5. QR kích hoạt một lần; QR không tự hết hạn trước khi kích hoạt nhưng có thể bị thu hồi; quyền demo có thời hạn 24 giờ kể từ lúc kích hoạt thành công. Mô hình gói phải mở rộng được; `DEMO_24H` chỉ là cấu hình demo tham khảo; UC12 quản lý QR Admin hiện có.
6. Grant gắn với thiết bị đã kích hoạt; phiên có thể được khôi phục trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị/khôi phục sang thiết bị khác.
7. Không có dữ liệu hoặc quyền Seller trong hệ thống hiện hành.
8. Ứng dụng User React Native chỉ hoạt động trực tuyến; không có quản lý/tải offline pack, offline map hoặc offline audio.
9. Chỉ `vi`/`en`; UI locale và audio locale độc lập, fallback hiển thị nhãn ngôn ngữ.
10. Publish POI yêu cầu English content hợp lệ và audio tiếng Anh hiện hành khớp phiên bản nội dung; tối đa 6 ảnh có thứ tự/gallery.
11. Auto narration chỉ khi ứng dụng đang hoạt động và hệ điều hành cho phép.
12. Chỉ có hai role `ADMIN` và `SUPER_ADMIN`; RBAC động để sau.
13. Analytics/Audit theo các định nghĩa ở UC14–UC15; mục tiêu NFR theo BRD chưa được đo kiểm. UC08 ngoài MVP; UC12 quản lý QR Admin hiện có.

## Các điểm còn cần đặc tả/kiểm chứng

- Không có tích hợp thanh toán; QR Admin hiện có là luồng được hỗ trợ.
- Kết quả kiểm thử khôi phục phiên trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị. QR được thu hồi theo API quản trị hiện hành.
- Kiểm chứng nguồn dữ liệu và độ chính xác của metric tại UC14; Không có chức năng xuất báo cáo ở UC13 hoặc UC14; chỉ kiểm chứng nguồn dữ liệu và độ chính xác của metric.
- Kiểm chứng cấu hình retention 24 tháng, backup hằng ngày, khả năng khôi phục và fail-closed cho thao tác nhạy cảm.
- Danh sách trình duyệt hỗ trợ và kết quả đo NFR.
- Mọi quyết định chuyển sang production.

---
**Author(s):** Product Owner / nhóm dự án$2
**Trạng thái phê duyệt:** Bản cập nhật theo các quyết định MVP ngày 2026-10-20; UC08 ngoài phạm vi MVP; UC12 quản lý QR Admin hiện có. Các mục còn mở được liệt kê trong phần Open Decisions; chưa phải phê duyệt nghiệm thu triển khai.

## Quy tắc toàn hệ thống: soft delete

- Mọi thực thể nghiệp vụ có thể bị xóa (POI, bản dịch/media metadata và tài khoản Admin) phải dùng soft delete; không xóa vật lý theo luồng nghiệp vụ thông thường.
- Bản ghi bị xóa mềm phải có tối thiểu `deleted_at` và `deleted_by` (hoặc trường tương đương), bị loại khỏi truy vấn/danh sách mặc định và không được dùng để tạo nghiệp vụ mới. Khôi phục chỉ dành cho role được cấp quyền và phải ghi audit.
- Giữ nguyên quan hệ và lịch sử audit; xóa mềm POI không được làm mất audit hay làm hỏng tham chiếu của báo cáo. Ràng buộc unique phải tính đến trạng thái đã xóa theo thiết kế DB.
- Audit log là append-only; không soft-delete hoặc chỉnh sửa log qua UI nghiệp vụ. Ngoại lệ xóa vật lý chỉ khi có yêu cầu pháp lý/bảo vệ dữ liệu được phê duyệt, có quy trình riêng và audit.

## Open Decisions còn lại sau cập nhật

- Kết quả đo kiểm NFR trên môi trường mục tiêu và danh sách trình duyệt/thiết bị hỗ trợ.
- Metric nguồn dữ liệu thực tế và kiểm thử độ chính xác sau khi có instrumentation; các ngưỡng ở đây là tiêu chí mục tiêu, chưa phải kết quả đo.
- Chính sách khôi phục/retention cụ thể theo luật áp dụng và khả năng hạ tầng; mục tiêu mặc định nêu tại UC14–UC15 cần được rà soát trước production.
- Không có tích hợp thanh toán hoặc đơn hàng trong phạm vi hiện hành.
