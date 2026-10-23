# ĐẶC TẢ CA SỬ DỤNG — MULTITIONAL-TRANSLATOR-

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
| UC09 | Quản lý tài khoản Seller | Admin |
| UC10 | Quản lý tài khoản Admin | Super Admin |
| UC11 | Quản lý vai trò và phân quyền (RBAC) | Super Admin |
| UC12 | Quản lý thanh toán và tạo QR truy cập | Seller |
| UC13 | Xem thống kê và báo cáo Seller | Seller |
| UC14 | Xem Analytics toàn hệ thống | Admin |
| UC15 | Xem Audit Log | Super Admin |

## Quy ước và thuật ngữ

- **User:** khách truy cập các tính năng tham quan sau khi quét và kích hoạt QR hợp lệ. User không cần đăng ký, đăng nhập hoặc đăng xuất bằng tài khoản cá nhân.
- **Seller:** tài khoản do Admin tạo và quản lý. Seller chỉ thao tác trên giao dịch, QR và báo cáo thuộc phạm vi của chính mình.
- **QR truy cập:** mã dùng một lần để kích hoạt quyền sử dụng các chức năng User trong thời hạn của gói/dịch vụ đã thanh toán. QR không phải bằng chứng thanh toán tự thân.
- **Thanh toán chuyển khoản:** trạng thái thanh toán chỉ được xác nhận tự động khi nhận được xác nhận đáng tin cậy từ tích hợp ngân hàng/đơn vị thanh toán. Không coi ảnh chụp màn hình do người dùng gửi là xác nhận tự động.
- **Thanh toán tiền mặt:** Seller xác nhận đã nhận tiền; thao tác này phải được ghi nhận để truy vết.
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
User quét QR riêng cho khách hàng để kích hoạt quyền. QR chỉ kích hoạt một lần và quyền gắn với thiết bị đã kích hoạt. Hệ thống xác minh QR dùng một lần và trạng thái thu hồi; nếu hợp lệ, cấp quyền User trong 24 giờ kể từ lúc kích hoạt thành công. MVP không quản lý giao dịch/thanh toán hoặc tạo QR nội bộ (UC12 ngoài phạm vi). Không yêu cầu tài khoản Tourist.

### 5. Điều kiện tiên quyết
- Website và backend đang truy cập được.
- Mỗi khách hàng có QR riêng. Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công. QR không tự hết hạn trước khi kích hoạt; Seller vẫn có thể thu hồi QR. UC12 và nghiệp vụ thanh toán/tạo QR nội bộ ngoài MVP.
- QR chưa được sử dụng và chưa bị thu hồi. QR không tự hết hạn trước lần kích hoạt đầu tiên; Seller có thể thu hồi QR.
- Thời lượng quyền demo hiện tại là 24 giờ kể từ lúc kích hoạt thành công; thời lượng phải được lấy từ cấu hình để hỗ trợ gói khác trong tương lai.

### 6. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | User mở ứng dụng User và chọn quét QR hoặc mở QR link bằng camera/thiết bị hỗ trợ. | Website hiển thị hướng dẫn quét/mở QR. |
| 2 | User quét QR hoặc mở URL được mã hóa trong QR. | Hệ thống nhận token QR; không tin cậy dữ liệu quyền truy cập chỉ dựa trên nội dung hiển thị trong QR. **[A2]** |
| 3 | — | Backend kiểm tra token, trạng thái thu hồi và trạng thái chưa sử dụng của QR; không xác minh giao dịch thanh toán trong MVP vì UC12 nằm ngoài phạm vi. **[A1, E1, E3, E4, E5]** |
| 4 | — | Nếu hợp lệ, backend nguyên tử đánh dấu QR đã sử dụng và tạo phiên/quyền truy cập có thời hạn. **[E2, E6]** |
| 5 | — | Hệ thống hiển thị xác nhận kích hoạt thành công và mở chức năng User được cấp quyền. |
| 6 | User chọn bản đồ, POI hoặc audio. | Hệ thống cho phép truy cập trong phạm vi và thời hạn đã cấp. |

### 7. Luồng thay thế
- **A1 — User đã có phiên quyền truy cập còn hiệu lực trên thiết bị đã kích hoạt:** hệ thống tiếp tục phiên đó; QR mới vẫn tuân theo quy tắc dùng một lần nếu được gửi để đổi.
- **A2 — QR được mở qua liên kết thay vì camera:** ứng dụng User xử lý URL/token theo cùng quy tắc xác minh như quét camera.
### 8. Luồng ngoại lệ
- **E1 — QR không hợp lệ hoặc bị sửa đổi:** từ chối kích hoạt, không cấp quyền và hiển thị thông báo chung.
- **E2 — QR đã được sử dụng:** từ chối dùng lại; hướng dẫn liên hệ Seller nếu cần hỗ trợ. Không tự cấp quyền cho thiết bị khác.
- **E3 — Token QR bị thu hồi hoặc không hợp lệ:** không cấp quyền. Trong MVP, hệ thống không có trạng thái thanh toán nội bộ để xác minh.
- **E4 — QR bị thu hồi hoặc quyền/gói không còn hợp lệ:** từ chối kích hoạt. QR chưa kích hoạt không tự hết hạn; QR bị thu hồi hoặc không hợp lệ phải bị từ chối. Quyền sau kích hoạt có thời hạn theo gói đã áp dụng.
- **E5 — Mất mạng/backend không phản hồi:** không cấp quyền khi chưa xác minh được; cho phép thử lại khi kết nối phục hồi.
- **E6 — Lỗi ghi nhận dùng một lần:** giao dịch kích hoạt phải có tính nguyên tử để tránh hai thiết bị cùng đổi một QR thành công.
### 9. Sự kiện kích hoạt
User nhận được QR riêng của mình và muốn kích hoạt quyền truy cập tính năng tham quan. Seller tạo và cấp QR sau khi thanh toán thành công.

### 10. Quy tắc nghiệp vụ
- QR có thể được quét/đổi **một lần**; quyền truy cập sau đó duy trì theo thời hạn gói/dịch vụ.
- QR cấp quyền sử dụng **các chức năng User trong phạm vi dịch vụ**, không tự động cấp quyền quản trị.
- Token QR phải khó đoán, không chứa dữ liệu nhạy cảm dạng rõ, có thể bị thu hồi và không được ghi nguyên văn vào log.
- QR có thể bị thu hồi. QR không tự hết hạn trước khi kích hoạt; Seller có thể thu hồi QR. Quyền truy cập có thời hạn 24 giờ kể từ khi kích hoạt thành công theo cấu hình demo; kiến trúc phải cho phép cấu hình thời lượng gói trong tương lai.
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

# UC09 — QUẢN LÝ TÀI KHOẢN SELLER

### 1. Mã ca sử dụng
**UC09**

### 2. Tác nhân
**Admin**

### 3. Tóm tắt
Admin tạo và quản lý tài khoản Seller. Seller không tự đăng ký.

### 4. Điều kiện tiên quyết
- Actor đã đăng nhập vùng quản trị.
- Actor có quyền quản lý Seller.

### 5. Luồng sự kiện chính
1. Admin mở trang quản lý Seller.
2. Hệ thống hiển thị danh sách Seller trong phạm vi quyền.
3. Actor tạo tài khoản Seller hoặc chọn tài khoản cần cập nhật. **[E1]**
4. Actor nhập/cập nhật thông tin và trạng thái hoạt động. **[A1, A2, A3, E1, E2]**
5. Hệ thống kiểm tra tính hợp lệ và lưu thay đổi. **[A1, A2, A3, E1, E3]**
6. Hệ thống thông báo kết quả và làm mới danh sách. **[A1, A2, A3]**

### 6. Luồng thay thế
- **A1 — Vô hiệu hóa Seller để chặn tạo giao dịch/QR mới.**
- **A2 — Kích hoạt lại Seller theo quyền.**
- **A3 — Đặt lại thông tin xác thực theo chính sách quản trị được phê duyệt.**
### 7. Luồng ngoại lệ
- **E1 — Tài khoản trùng hoặc dữ liệu sai**: từ chối lưu.
- **E2 — Seller có dữ liệu liên quan**: dùng soft delete; giữ giao dịch, báo cáo và audit lịch sử, đồng thời chặn đăng nhập/tạo nghiệp vụ mới khi tài khoản đã bị xóa mềm.
- **E3 — Actor không có quyền**: từ chối ở backend.
### 8. Quy tắc nghiệp vụ
- Tài khoản Seller chỉ do Admin tạo; Super Admin không được tạo hoặc quản lý Seller.
- Seller chỉ xem/thao tác giao dịch, QR và báo cáo của chính mình.
- Vô hiệu hóa Seller không tự động xóa giao dịch/audit đã phát sinh.

### 9. Điều kiện hậu
Tài khoản Seller được tạo/cập nhật hoặc trạng thái thay đổi theo quyền.

---

# UC10 — QUẢN LÝ TÀI KHOẢN ADMIN

### 1. Mã ca sử dụng
**UC10**

### 2. Tác nhân
**Super Admin**

### 3. Tóm tắt
Super Admin tạo, cập nhật, vô hiệu hóa và quản lý tài khoản Admin.

### 4. Điều kiện tiên quyết
- Super Admin có phiên quản trị hợp lệ và quyền phù hợp.

### 5. Luồng sự kiện chính
1. Super Admin mở quản lý tài khoản Admin.
2. Hệ thống hiển thị tài khoản trong phạm vi.
3. Super Admin tạo/chọn tài khoản. **[E1]**
4. Super Admin nhập hoặc cập nhật dữ liệu tài khoản. **[A1, A2, E1]**
5. Hệ thống kiểm tra và lưu. **[A1, A2, E2]**
6. Hệ thống hiển thị kết quả. **[E3]**

### 6. Luồng thay thế
- **A1 — Vô hiệu hóa/kích hoạt tài khoản.**
- **A2 — Đặt lại thông tin xác thực theo chính sách đã phê duyệt.**
### 7. Luồng ngoại lệ
- **E1 — Tài khoản không tồn tại hoặc dữ liệu không hợp lệ**: thông báo và làm mới dữ liệu.
- **E2 — Không cho phép xóa/vô hiệu hóa tài khoản theo cách làm mất Super Admin cuối cùng.**
- **E3 — Thao tác thất bại**: không báo thành công giả.
### 8. Quy tắc nghiệp vụ
- Gán/đổi role thuộc UC11; không được tự đổi vai trò hoặc tự vô hiệu hóa tài khoản Super Admin nếu không còn Super Admin khác đang hoạt động.
- Super Admin không được tự đổi vai trò hoặc tự vô hiệu hóa chính mình. Thay đổi vai trò/trạng thái tài khoản Super Admin phải do Super Admin khác thực hiện; sau thao tác phải còn ít nhất một Super Admin đang hoạt động.

### 9. Điều kiện hậu
Tài khoản Admin được cập nhật theo thao tác hợp lệ.

---

# UC11 — QUẢN LÝ VAI TRÒ VÀ PHÂN QUYỀN (RBAC)

### 1. Mã ca sử dụng
**UC11**

### 2. Tác nhân
**Super Admin**

### 3. Tóm tắt
Super Admin quản lý role và permission registry được phép gán cho từng role.

### 4. Điều kiện tiên quyết
- Super Admin có quyền RBAC.
- Role store và permission registry khả dụng.

### 5. Luồng sự kiện chính
1. Super Admin mở quản lý RBAC.
2. Hệ thống hiển thị role và quyền hiện có.
3. Super Admin tạo/sửa/xóa role hoặc điều chỉnh permission array. **[A1, A2, E1, E2]**
4. Hệ thống kiểm tra tên role, permission hợp lệ và các ràng buộc an toàn. **[E1, E2, E3, E4]**
5. Super Admin lưu thay đổi. **[A2]**
6. Hệ thống lưu và hiển thị kết quả. **[E4]**

### 6. Luồng thay thế
- **A1 — Tạo role mới với tên duy nhất và permission thuộc registry.**
- **A2 — Gán role cho tài khoản qua luồng quản lý tài khoản tương ứng.**
### 7. Luồng ngoại lệ
- **E1 — Permission không tồn tại hoặc role trùng tên**: từ chối.
- **E2 — Role hệ thống/role đang được sử dụng bị yêu cầu xóa**: từ chối hoặc yêu cầu chuyển tài khoản trước.
- **E3 — Không cho phép loại bỏ quyền quản trị cuối cùng theo quy tắc an toàn đã phê duyệt.**
- **E4 — Không có quyền**: từ chối ở backend.
### 8. Quy tắc nghiệp vụ
- Quyền phải được kiểm tra tại backend; ẩn nút trên UI không thay thế authorization.
- Seller chỉ được truy cập dữ liệu của chính mình; cần kiểm tra ownership ở backend.
- Không được tự động coi mọi permission trong tài liệu cũ là đã triển khai.

### 9. Điều kiện hậu
Cấu hình role hợp lệ được lưu và có hiệu lực theo chính sách áp dụng.

---

# UC12 — QUẢN LÝ THANH TOÁN VÀ TẠO QR TRUY CẬP

> **Phạm vi:** KHÔNG THỰC HIỆN TRONG MVP. MVP không triển khai luồng thanh toán, quản lý giao dịch hoặc tạo QR trong hệ thống. Sau khi xác nhận thanh toán thành công, Seller tạo và cấp QR riêng cho User. QR không tự hết hạn trước khi kích hoạt nhưng có thể bị thu hồi. Nội dung bên dưới là định hướng cho giai đoạn sau, không phải cam kết triển khai MVP.

### 1. Mã ca sử dụng
**UC12**

### 2. Tên ca sử dụng
**Quản lý thanh toán và tạo QR truy cập**

### 3. Tác nhân
**Seller**; hệ thống ngân hàng/đơn vị thanh toán là tác nhân hỗ trợ đối với chuyển khoản.

### 4. Tóm tắt
Seller tạo giao dịch cho khách và ghi nhận/xác nhận thanh toán theo phương thức được hỗ trợ. Chỉ sau khi thanh toán thành công, Seller tạo và cấp QR riêng, dùng một lần, để User kích hoạt quyền truy cập trong thời hạn gói/dịch vụ. QR chưa kích hoạt không tự hết hạn nhưng có thể bị Seller thu hồi. Seller chỉ xem và thao tác trên giao dịch của chính mình.

### 5. Điều kiện tiên quyết
- Seller đã đăng nhập và tài khoản đang hoạt động.
- Seller có quyền tạo giao dịch.
- Danh mục gói/dịch vụ, giá và thời hạn đã được cấu hình.
- Với chuyển khoản, tích hợp ngân hàng/đơn vị thanh toán đang khả dụng.

### 6. Luồng sự kiện chính

| Step | Hành động của tác nhân | Phản hồi của hệ thống |
|---|---|---|
| 1 | Seller chọn tạo giao dịch và chọn gói/dịch vụ. | Hệ thống hiển thị giá, thời hạn và thông tin giao dịch. **[E3, E5]** |
| 2 | Seller chọn phương thức thanh toán tiền mặt hoặc chuyển khoản. | Hệ thống tạo giao dịch ở trạng thái chờ thanh toán/xác nhận. **[E3, E5]** |
| 3a | Seller nhận tiền mặt và xác nhận đã thu tiền. | Hệ thống ghi nhận actor, thời điểm, số tiền và phương thức; trạng thái chuyển sang đã thanh toán nếu dữ liệu hợp lệ. **[E3, E5]** |
| 3b | Khách chuyển khoản theo hướng dẫn thanh toán. | Hệ thống chờ webhook/đối soát đáng tin cậy từ ngân hàng/đơn vị thanh toán và xác minh mã giao dịch, số tiền, trạng thái. **[A1, E1, E2, E5]** |
| 4b | — | Khi nhận xác nhận chuyển khoản hợp lệ, hệ thống tự cập nhật trạng thái giao dịch đã thanh toán. **[A1, E1, E2]** |
| 5 | — | Khi giao dịch được xác nhận đã thanh toán, hệ thống tạo QR token dùng một lần gắn với giao dịch, Seller và thời hạn gói. **[A2, E2, E3, E4]** |
| 6 | Seller hiển thị QR cho khách. | Hệ thống hiển thị QR và trạng thái giao dịch; không hiển thị QR có thể đổi trước khi thanh toán được xác nhận. **[A2, E4, E5]** |
| 7 | User quét QR. | Hệ thống thực hiện UC02 và đánh dấu QR đã sử dụng khi đổi thành công. **[A3]** |

### 7. Luồng thay thế
- **A1 — Chuyển khoản chưa được xác nhận:** Seller xem trạng thái chờ; hệ thống chưa tạo QR kích hoạt.
- **A2 — Giao dịch đã thanh toán nhưng QR chưa hiển thị do lỗi:** Seller có thể tải lại trạng thái hoặc yêu cầu hệ thống hiển thị lại cùng QR còn hiệu lực; không tạo nhiều quyền độc lập cho một giao dịch.
- **A3 — QR đã được đổi:** Seller xem trạng thái đã sử dụng; không thể tái kích hoạt bằng QR cũ.
### 8. Luồng ngoại lệ
- **E1 — Xác nhận chuyển khoản không khớp số tiền/mã giao dịch:** giao dịch không được tự đánh dấu đã thanh toán; đưa vào trạng thái cần kiểm tra.
- **E2 — Webhook trùng lặp:** xử lý idempotent, không tạo nhiều giao dịch/quyền cho một khoản thanh toán.
- **E3 — Seller không hoạt động hoặc không sở hữu giao dịch:** từ chối thao tác.
- **E4 — Không thể tạo QR:** giữ trạng thái thanh toán chính xác, báo lỗi và cho phép thử lại mà không thu tiền lần nữa.
- **E5 — Mất mạng:** không xác nhận thành công dựa trên trạng thái chưa được máy chủ ghi nhận.
### 9. Quy tắc nghiệp vụ
- Tiền mặt: Seller xác nhận thủ công.
- Phương thức thanh toán và cách Seller xác nhận thu tiền do Seller tự quyết định ngoài phạm vi MVP. Nếu hệ thống tích hợp thanh toán trong tương lai, phải xác minh bằng nguồn tin cậy và không coi redirect/ảnh chụp là bằng chứng thanh toán.
- Một QR chỉ đổi thành công một lần. QR được đổi thành công tạo quyền User trong thời hạn gói/dịch vụ; quyền có thể tiếp tục tồn tại trong phiên đã kích hoạt cho đến hết hạn.
- QR không cấp quyền Seller/Admin.
- Seller không được sửa trạng thái thanh toán chuyển khoản đã xác minh hoặc tự ghi nhận hoàn tiền nếu chưa được cấp quyền.
- Thiết kế gói dịch vụ phải mở rộng được (bảng dữ liệu/cấu hình gói, giá, đơn vị tiền, thời lượng, trạng thái và phiên bản điều kiện); không hard-code một gói duy nhất vào logic. Gói demo hiện tại là `DEMO_24H`, giá cấu hình 1 VND và quyền 24 giờ từ lúc redeem; giá/điều kiện thực tế khi triển khai UC12 do Seller/chủ sản phẩm quyết định.
- QR không có hạn hết hiệu lực trước lần redeem đầu tiên; vẫn có thể bị thu hồi. Thời hạn quyền truy cập chỉ bắt đầu tính từ lúc redeem thành công.

### 10. Điều kiện hậu
- Thành công: giao dịch và thanh toán được ghi nhận; QR một lần được tạo; quyền được cấp chỉ sau khi User đổi QR thành công.
- Thất bại: trạng thái thanh toán/giao dịch được giữ chính xác; không cấp quyền trái phép.

---

# UC13 — XEM THỐNG KÊ VÀ BÁO CÁO SELLER

### 1. Mã ca sử dụng
**UC13**

### 2. Tác nhân
**Seller**

### 3. Tóm tắt
Seller xem thống kê và báo cáo chỉ thuộc dữ liệu của chính Seller, gồm doanh thu, giao dịch và mức sử dụng tính năng User.

### 4. Điều kiện tiên quyết
- Seller đã đăng nhập và tài khoản đang hoạt động.
- Seller có quyền xem báo cáo.
- Dữ liệu giao dịch/QR/usage đã được ghi nhận và nguồn báo cáo khả dụng.

### 5. Luồng sự kiện chính
1. Seller mở trang Báo cáo.
2. Hệ thống xác định phạm vi dữ liệu từ danh tính Seller phía máy chủ, không tin cậy Seller ID do client tự gửi. **[E2]**
3. Seller chọn khoảng thời gian và bộ lọc được hỗ trợ. **[A2]**
4. Hệ thống tổng hợp và hiển thị: **[A1, A2, A3, E1, E2, E3]**
   - Doanh thu theo ngày/tháng và phương thức thanh toán.
   - Số giao dịch theo trạng thái.
   - Số QR đã tạo, đã đổi, chưa đổi, hết hạn/thu hồi nếu có.
   - Mức sử dụng tính năng User như lượt truy cập, xem POI hoặc phát âm thanh, theo định nghĩa metric được chốt.
5. Seller xem kết quả; dữ liệu chỉ bao gồm các giao dịch/phiên thuộc Seller đó. **[A1, A3]**

### 6. Luồng thay thế
- **A1 — Chưa có dữ liệu:** hiển thị trạng thái rỗng và khoảng thời gian được chọn.
- **A2 — Thay đổi bộ lọc/ngày:** hệ thống tải lại báo cáo theo điều kiện mới.
- **A3 — Yêu cầu xuất báo cáo:** không được hỗ trợ; hệ thống chỉ cung cấp xem và lọc trên giao diện.
### 7. Luồng ngoại lệ
- **E1 — Nguồn báo cáo không khả dụng**: hiển thị lỗi và cho phép thử lại.
- **E2 — Actor cố truy cập dữ liệu Seller khác**: backend từ chối.
- **E3 — Dữ liệu chưa đồng bộ**: thể hiện thời điểm cập nhật gần nhất và không khẳng định số liệu là thời gian thực nếu không đảm bảo.
### 8. Quy tắc nghiệp vụ
- Phạm vi Seller là **dữ liệu của chính Seller**.
- Doanh thu phải phân biệt tổng tiền thu, giao dịch thất bại/hủy và hoàn tiền nếu tính năng hoàn tiền được hỗ trợ.
- Tất cả timestamp lưu theo UTC và hiển thị theo múi giờ `Asia/Ho_Chi_Minh`; dashboard ghi rõ thời điểm cập nhật, mục tiêu độ trễ tối đa 5 phút. Định nghĩa metric: `poi_view` là lượt xem chi tiết POI sau khi tải thành công; `audio_play` là lần người dùng nhấn Play và audio bắt đầu phát; `session_start` là lần đầu grant hợp lệ được sử dụng trên thiết bị đã kích hoạt. Khử trùng lặp theo event ID; lưu event thô tối đa 90 ngày và số liệu tổng hợp 13 tháng. Không hỗ trợ xuất báo cáo ra CSV, Excel, PDF hoặc định dạng tệp khác; dashboard chỉ hỗ trợ xem và lọc. Các metric tài chính chỉ xuất hiện khi có dữ liệu giao dịch hợp lệ.
- Không hiển thị thông tin cá nhân nhạy cảm của User trong báo cáo nếu không cần thiết.

### 9. Điều kiện hậu
Báo cáo được hiển thị mà không làm thay đổi giao dịch hoặc quyền truy cập.

---

# UC14 — XEM ANALYTICS TOÀN HỆ THỐNG

### 1. Mã ca sử dụng
**UC14**

### 2. Tác nhân
**Admin, Super Admin**

### 3. Tóm tắt
Admin/Super Admin có quyền xem số liệu vận hành toàn hệ thống, tách biệt với báo cáo phạm vi riêng của Seller.

### 4. Điều kiện tiên quyết
- Actor có phiên quản trị hợp lệ và quyền `analytics:view`.
- Analytics read models khả dụng.

### 5. Luồng sự kiện chính
1. Actor mở Analytics.
2. Hệ thống tải dữ liệu read model và áp dụng phạm vi quyền. **[E1, E2, E3]**
3. Hệ thống hiển thị các metric được thống nhất, có thể gồm lượt xem POI, lượt phát âm thanh, tìm kiếm, POI phổ biến, giao dịch và trạng thái thanh toán tổng hợp. **[A1, A2, E3]**
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
- UC14 là analytics toàn hệ thống; UC13 là báo cáo Seller của chính mình.
- Metric, công thức, múi giờ, consent, retention và phạm vi lọc phải được định nghĩa thống nhất.
- Dashboard chỉ hỗ trợ xem số liệu tổng hợp và lọc theo ngày/POI/locale phù hợp; không có chức năng xuất báo cáo hoặc drill-down xuất file. Metric dùng chung định nghĩa với UC13; timestamp lưu UTC, hiển thị `Asia/Ho_Chi_Minh`, độ trễ mục tiêu tối đa 5 phút, event thô 90 ngày và số liệu tổng hợp 13 tháng.

### 9. Điều kiện hậu
Dashboard được hiển thị theo quyền; thao tác xem không thay đổi dữ liệu nghiệp vụ.

---

# UC15 — XEM AUDIT LOG

### 1. Mã ca sử dụng
**UC15**

### 2. Tác nhân
**Super Admin**

### 3. Tóm tắt
Chỉ Super Admin được tra cứu Audit Log toàn hệ thống, gồm sự kiện quản trị và nghiệp vụ quan trọng. Admin và Seller không được xem Audit Log toàn hệ thống.

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
- Các sự kiện cần audit tối thiểu: tạo/sửa/vô hiệu hóa Seller; tạo giao dịch; xác nhận tiền mặt; nhận xác nhận chuyển khoản; tạo/đổi/thu hồi QR; thay đổi quyền; truy cập bị từ chối quan trọng.
- Audit log lưu tối thiểu 24 tháng; chỉ Super Admin/role được cấp quyền mới được đọc. Bản ghi audit append-only, không cho sửa/xóa qua nghiệp vụ thông thường; áp dụng kiểm soát truy cập, backup hằng ngày và kiểm thử khôi phục định kỳ. Không ghi token QR, mật khẩu, secret hoặc credential dạng rõ. Nếu audit store không khả dụng, thao tác nhạy cảm (đổi role, xác nhận thanh toán, redeem/revoke QR, soft delete/restore) phải fail-closed; thao tác đọc thông thường được phép tiếp tục và phát cảnh báo.

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
| UC09 | creates/manages Seller account | UC12–UC13 | Seller phải được Admin/Super Admin cấp tài khoản. |
| UC12 | confirms payment and issues one-time QR | UC02 | User chỉ được cấp quyền sau khi thanh toán được xác nhận và QR được đổi. |
| UC12 | creates transaction/QR events | UC13–UC14 | Dữ liệu giao dịch phục vụ báo cáo Seller và Analytics hệ thống. |
| UC02 | emits access/usage events | UC13–UC14 | Thống kê mức sử dụng dựa trên sự kiện đã ghi nhận. |
| UC11 | enforces roles/permissions | UC07–UC15 | RBAC quyết định quyền truy cập; ownership Seller phải được kiểm tra backend. |
| UC09–UC12 | generates audit events | UC15 | Các thay đổi quan trọng phải có khả năng truy vết. |

## Các quyết định đã chốt

1. Không yêu cầu Tourist/User đăng ký, đăng nhập hoặc đăng xuất bằng tài khoản cá nhân.
2. Seller account chỉ do Admin tạo; Super Admin không được tạo hoặc quản lý Seller.
3. UC12 (thanh toán/giao dịch/tạo QR nội bộ) ngoài MVP. Mỗi khách hàng có QR riêng; Seller tạo và cấp QR riêng cho User sau khi thanh toán thành công. VNPAY Sandbox chỉ là phương án tham khảo cho giai đoạn sau.
4. User phải redeem QR hợp lệ trước khi dùng chức năng User yêu cầu grant; kiểm tra quyền ở backend.
5. QR kích hoạt một lần; QR không tự hết hạn trước khi kích hoạt nhưng có thể bị thu hồi; quyền demo có thời hạn 24 giờ kể từ lúc kích hoạt thành công. Mô hình gói phải mở rộng được; `DEMO_24H` chỉ là cấu hình demo tham khảo, UC12 ngoài MVP.
6. Grant gắn với thiết bị đã kích hoạt; phiên có thể được khôi phục trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị/khôi phục sang thiết bị khác.
7. Seller chỉ xem và thao tác dữ liệu của chính mình; nghiệp vụ giao dịch/thanh toán/tạo QR thuộc UC12 ngoài MVP.
8. Ứng dụng User React Native chỉ hoạt động trực tuyến; không có quản lý/tải offline pack, offline map hoặc offline audio.
9. Chỉ `vi`/`en`; UI locale và audio locale độc lập, fallback hiển thị nhãn ngôn ngữ.
10. Publish POI yêu cầu English content hợp lệ và audio tiếng Anh hiện hành khớp phiên bản nội dung; tối đa 6 ảnh có thứ tự/gallery.
11. Auto narration chỉ khi ứng dụng đang hoạt động và hệ điều hành cho phép.
12. Chỉ có hai role `ADMIN` và `SUPER_ADMIN`; RBAC động để sau.
13. Analytics/Audit theo các định nghĩa ở UC13–UC15; mục tiêu NFR theo BRD chưa được đo kiểm. UC08/UC12 ngoài MVP.

## Các điểm còn cần đặc tả/kiểm chứng

- Tích hợp thanh toán/QR tự động thuộc giai đoạn sau MVP; VNPAY Sandbox chỉ là lựa chọn tham khảo nếu được duyệt.
- Kết quả kiểm thử khôi phục phiên trên cùng thiết bị trong 24 giờ; không hỗ trợ chuyển thiết bị. QR không tự hết hạn trước khi kích hoạt; Seller có thể thu hồi QR.
- Kiểm chứng nguồn dữ liệu và độ chính xác của metric đã định nghĩa tại UC13/UC14; Không có chức năng xuất báo cáo ở UC13 hoặc UC14; chỉ kiểm chứng nguồn dữ liệu và độ chính xác của metric.
- Kiểm chứng cấu hình retention 24 tháng, backup hằng ngày, khả năng khôi phục và fail-closed cho thao tác nhạy cảm.
- Danh sách trình duyệt hỗ trợ và kết quả đo NFR.
- Mọi quyết định chuyển sang production.

---
**Author(s):** Product Owner / nhóm dự án  
**Trạng thái phê duyệt:** Bản cập nhật theo các quyết định MVP ngày 2026-10-20; UC08 và UC12 ngoài phạm vi MVP. Các mục còn mở được liệt kê trong phần Open Decisions; chưa phải phê duyệt nghiệm thu triển khai.

## Quy tắc toàn hệ thống: soft delete

- Mọi thực thể nghiệp vụ có thể bị xóa (POI, bản dịch/media metadata, tài khoản, Seller, gói, giao dịch và dữ liệu quản trị liên quan) phải dùng soft delete; không xóa vật lý theo luồng nghiệp vụ thông thường.
- Bản ghi bị xóa mềm phải có tối thiểu `deleted_at` và `deleted_by` (hoặc trường tương đương), bị loại khỏi truy vấn/danh sách mặc định và không được dùng để tạo nghiệp vụ mới. Khôi phục chỉ dành cho role được cấp quyền và phải ghi audit.
- Giữ nguyên quan hệ và lịch sử giao dịch/audit; xóa mềm POI không được làm mất audit hay làm hỏng tham chiếu của báo cáo. Ràng buộc unique phải tính đến trạng thái đã xóa theo thiết kế DB.
- Audit log là append-only; không soft-delete hoặc chỉnh sửa log qua UI nghiệp vụ. Ngoại lệ xóa vật lý chỉ khi có yêu cầu pháp lý/bảo vệ dữ liệu được phê duyệt, có quy trình riêng và audit.

## Open Decisions còn lại sau cập nhật

- Kết quả đo kiểm NFR trên môi trường mục tiêu và danh sách trình duyệt/thiết bị hỗ trợ.
- Metric nguồn dữ liệu thực tế và kiểm thử độ chính xác sau khi có instrumentation; các ngưỡng ở đây là tiêu chí mục tiêu, chưa phải kết quả đo.
- Chính sách khôi phục/retention cụ thể theo luật áp dụng và khả năng hạ tầng; mục tiêu mặc định nêu tại UC13–UC15 cần được rà soát trước production.
- Tích hợp thanh toán/QR tự động thuộc giai đoạn sau MVP; VNPAY Sandbox chỉ là phương án thử nghiệm tham khảo, chưa phải cam kết triển khai.
