# USE CASE SPECIFICATION — CỦ CHI TUNNELS TOURISM GUIDE

## Danh sách Use Cases

| ID | Use Case | Actor(s) |
|---|---|---|
| UC01 | Đăng ký tài khoản | Tourist |
| UC02 | Đăng nhập | Tourist |
| UC03 | Đăng xuất | Tourist |
| UC04 | Chọn / Chuyển đổi ngôn ngữ | Tourist |
| UC05 | Khám phá bản đồ tương tác | Tourist |
| UC06 | Xem chi tiết POI | Tourist |
| UC07 | Nghe thuyết minh POI | Tourist |
| UC08 | Nhận thuyết minh tự động theo vị trí | Tourist |
| UC09 | Quản lý dữ liệu offline | Tourist |
| UC10 | Quản lý POI | Admin |
| UC11 | Giám sát tiến độ tạo Audio | Admin |
| UC12 | Quản lý tài khoản người dùng | Super Admin |
| UC13 | Quản lý tài khoản Admin | Super Admin |
| UC14 | Quản lý Vai trò và Phân quyền (RBAC) | Super Admin |
| UC15 | Xem Analytics | Admin, Super Admin |
| UC16 | Xem Audit Log | Super Admin |

---

# UC01 — Đăng ký tài khoản

### 1. Use Case Number
**UC01**

### 2. Use Case Name
**Đăng ký tài khoản**

### 3. Actor(s)
**Tourist**

### 4. Maturity
**Focused**

### 5. Summary

Tourist tạo tài khoản mới để có thể đăng nhập và sử dụng các chức năng tham quan yêu cầu authentication.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist chọn chức năng **Đăng ký tài khoản** từ trạng thái chưa authenticated. | System hiển thị giao diện đăng ký tài khoản. |
| 2 | Tourist nhập các thông tin đăng ký theo form. #A1-1 | System tiếp nhận dữ liệu đăng ký. Các trường gồm: **Username, Password, Confirm Password**. |
| 3 | Tourist gửi thông tin đăng ký. | System kiểm tra dữ liệu đăng ký theo các quy tắc của hệ thống. Validation gồm:
|||  - Username theo ràng buộc ở dưới. |
|||  - Password và Confirm Password phải khớp. |
|||  - Không được bỏ trống các trường bắt buộc. |
|||  - Các trường nhập phải đúng kiểu/định dạng do form yêu cầu. #E1-1 #E1-2|
| 4 | — | Nếu dữ liệu hợp lệ, System tạo tài khoản Tourist. |
| 5 | — | System thông báo kết quả đăng ký thành công. |
| 6 | — | System không tự động đăng nhập; Tourist phải thực hiện **UC02 – Đăng nhập**. |

### Ràng buộc

- Chỉ cho phép chữ cái, chữ số và ký tự `_`.
- Không được chứa khoảng trắng.
- Không được bắt đầu bằng số.
- Không được bắt đầu hoặc kết thúc bằng `_`.
- Độ dài đề xuất: **3–20 ký tự**.
- Không phân biệt hoa/thường khi kiểm tra trùng Username.
- Không dùng các Username hệ thống dành riêng (ví dụ tên role/route kỹ thuật)
- Không tự động trim rồi âm thầm thay đổi Username; dữ liệu không hợp lệ phải được báo lỗi để người dùng sửa.
- **Password:** tối thiểu **6 ký tự**. Password và Confirm Password phải khớp.

### 7. Alternative Paths

**#A1-1. Tourist chọn hủy đăng ký**

- Xảy ra tại Basic Flow Step 2.
- Tourist chọn Hủy/Cancel.
- System không tạo tài khoản và không lưu thông tin đăng ký chưa hoàn tất.
- System kết thúc thao tác đăng ký và đưa Tourist về màn hình Login.
- UC01 kết thúc.

### 8. Exception Paths

**#E1-1. Dữ liệu đăng ký không hợp lệ**

- Xảy ra tại Basic Flow Step 3.
- System từ chối dữ liệu đăng ký.
- System thông báo lỗi tương ứng và yêu cầu Tourist sửa dữ liệu.
- Thông báo lỗi được hiển thị ngay tại field và phải cho phép Tourist sửa dữ liệu rồi gửi lại.

**#E1-2. Tài khoản/định danh đã tồn tại**

- Username phải là duy nhất trong hệ thống, không phân biệt hoa/thường.
- Khi bị trùng, System từ chối đăng ký và yêu cầu chọn Username khác.

### 9. Extension Points

**None**

### 10. Triggers

Tourist muốn tạo tài khoản để sử dụng các chức năng yêu cầu authentication.

### 11. Assumptions

- Tourist chưa có tài khoản hợp lệ hoặc muốn tạo một tài khoản mới.
- Các quy tắc Username và Password đã được chốt; Password tối thiểu 6 ký tự và Confirm Password phải khớp.

### 12. Preconditions

- Tourist đang ở trạng thái chưa authenticated.
- Giao diện/chức năng đăng ký Tourist được cung cấp bởi hệ thống theo phạm vi UC01.

### 13. Post Conditions

**Thành công:**

- Một tài khoản Tourist hợp lệ được tạo trong hệ thống.
- Tourist có thể sử dụng UC02 để đăng nhập.
- Trạng thái sau registration: tài khoản được tạo nhưng Tourist **chưa authenticated**..

**Thất bại:**

- Không tạo tài khoản mới nếu dữ liệu bị từ chối.

---

# UC02 — Đăng nhập

### 1. Use Case Number
**UC02**

### 2. Use Case Name
**Đăng nhập**

### 3. Actor(s)
**Tourist**

### 4. Maturity
**Focused**

### 5. Summary

Tourist xác thực tài khoản và bắt đầu một authenticated session để có thể sử dụng các chức năng tham quan được bảo vệ.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist chọn **Đăng nhập**. | System hiển thị giao diện đăng nhập. |
| 2 | Tourist nhập credential của tài khoản. | System tiếp nhận credential. Loại credential: **Username + Password**. |
| 3 | Tourist gửi yêu cầu đăng nhập. | System xác thực credential với thông tin tài khoản. #E2-1 #E2-2|
| 4 | — | Nếu credential hợp lệ, System tạo authenticated session cho Tourist. |
| 5 | — | System xác định trạng thái authenticated của Tourist để cho phép truy cập các chức năng được bảo vệ. |
| 6 | — | System chuyển Tourist tới màn hình phù hợp sau login. Destination sau login: **màn hình chính/Map của ứng dụng Tourist**. |

### 7. Alternative Paths

### 8. Exception Paths

**#E2-1. Credential không hợp lệ**

- Xảy ra tại Basic Flow Step 3.
- System không tạo authenticated session.
- System thông báo đăng nhập thất bại.
- Tourist được phép thực hiện lại bước nhập credential.

> Cho phép Tourist thử đăng nhập lại, không giới hạn số lần retry.

**#E2-2. Tài khoản không được xác thực**

- Xảy ra khi System không thể xác định một tài khoản Tourist hợp lệ từ credential được cung cấp.
- System thông báo lỗi xác thực.
- Tourist quay lại bước nhập credential.

System có thể dùng thông báo xác thực thất bại thống nhất, không bắt buộc phân biệt rõ Username không tồn tại và Password sai ở UI.

### 9. Extension Points

**None**

### 10. Triggers

Tourist muốn truy cập các chức năng tham quan yêu cầu authenticated session.

### 11. Assumptions

- Tourist đã có tài khoản hợp lệ.
- Session được tạo sau khi authentication thành công.
- Authorization được xử lý như cross-cutting behavior, không phải một UC riêng.

### 12. Preconditions

- Tourist chưa có authenticated session.
- Chức năng Login Tourist được cung cấp trong phạm vi hệ thống; route/API cụ thể được xem là chi tiết implementation.

### 13. Post Conditions

**Thành công:**

- Tourist có authenticated session.
- Tourist có thể truy cập Tourist Core UC với điều kiện authorization phù hợp.

**Thất bại:**

- Không tạo authenticated session mới.
- Tourist vẫn ở trạng thái chưa authenticated.

---

# UC03 — Đăng xuất

### 1. Use Case Number
**UC03**

### 2. Use Case Name
**Đăng xuất**

### 3. Actor(s)
**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist kết thúc authenticated session hiện tại và trở về trạng thái chưa authenticated.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist đang có authenticated session. | System duy trì trạng thái authenticated của Tourist. |
| 2 | Tourist chọn **Đăng xuất**. | System xử lý yêu cầu logout. |
| 3 | — | System kết thúc authenticated session hiện tại. |
| 4 | — | System đưa Tourist về trạng thái **chưa authenticated**. |
| 5 | — | System chuyển Tourist về **màn hình Login** sau logout. |

### 7. Alternative Paths

### 8. Exception Paths

**#E3. Session không còn hợp lệ tại thời điểm logout**

- System vẫn đưa Tourist về trạng thái chưa authenticated.
- Nếu backend đã mất session, logout được coi là hoàn tất từ góc nhìn UI.

### 9. Extension Points

**None**

### 10. Triggers

Tourist muốn kết thúc phiên sử dụng hệ thống hiện tại.

### 11. Assumptions

- Tourist đã có authenticated session.
- Logout chỉ kết thúc trạng thái authentication hiện tại.
- Không tạo một UC Session Management riêng.

### 12. Preconditions

- Tourist có authenticated session.

### 13. Post Conditions

**Thành công:**

- Tourist không còn authenticated session.
- Tourist không còn được xem là authenticated khi truy cập các Tourist Core UC yêu cầu login.

**Session không còn hợp lệ:**

- System đưa Tourist về trạng thái chưa authenticated và về màn hình Login.

---

# UC04 — Chọn / Chuyển đổi ngôn ngữ

### 1. Use Case Number

**UC04**

### 2. Use Case Name

**Chọn / Chuyển đổi ngôn ngữ**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist chọn hoặc thay đổi locale mà ứng dụng sử dụng để hiển thị giao diện và nội dung POI.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist mở ứng dụng trong startup flow **hoặc** đang sử dụng ứng dụng và chọn chức năng đổi ngôn ngữ. | System hiển thị trạng thái/lựa chọn locale khả dụng. |
| 2 | Tourist chọn một locale mong muốn. | System bắt đầu xử lý locale được chọn. |
| 3 | — | System chuẩn bị **UI Bundle** cho locale được chọn từ nguồn phù hợp. #A4-1 #A4-2 #E4-1|
| 4 | — | System chuẩn bị **POI content locale** tương ứng. Content locale của POI được tải theo target locale và có fallback chain được hệ thống định nghĩa. #E4-2|
| 5 | — | System chờ hai lane cần thiết đạt trạng thái sẵn sàng để hoàn tất việc switch. |
| 6 | — | System áp dụng locale mới cho giao diện và nội dung POI. |
| 7 | — | Tourist tiếp tục sử dụng ứng dụng với ngôn ngữ mới. |

### 7. Alternative Paths

**#A4-1. UI Bundle đã có sẵn trong cache/static bundle**

**Điểm bắt đầu:** Basic Flow Step 3.

1. System kiểm tra nguồn bundle hiện có.
2. Bundle đã ở trạng thái ready.
3. System sử dụng bundle đó thay vì phải chờ generation từ server.
4. Quay lại Basic Flow Step 5.

**#A4-2. Locale được chọn chưa có generated UI bundle sẵn sàng**

**Điểm bắt đầu:** Basic Flow Step 3.

1. System kiểm tra trạng thái bundle.
2. Nếu bundle chưa ready, System có thể phục vụ **English fallback** trong trạng thái pending.
3. System tiếp tục tạo bundle theo cơ chế background.
4. Khi bundle sẵn sàng, frontend cập nhật sang locale yêu cầu.
5. Quay lại Basic Flow Step 5.

### 8. Exception Paths

**#E4-1. UI bundle cho locale yêu cầu không thể trở thành ready**

- Xảy ra trong quá trình chuẩn bị UI Bundle.
- Trạng thái `ready`, `pending` và `failed`.
- Khi bundle ở `failed`, System giữ locale hiện tại và thông báo rằng ngôn ngữ mới chưa thể tải.
- Người dùng vẫn có thể thử đổi lại sau.
- Không tự động chuyển sang locale khác nếu không cần thiết.

**#E4-2. POI content locale không thể chuẩn bị đầy đủ**

- Xảy ra trong quá trình chuẩn bị Content Locale/hotset.
- System không thể hoàn tất language switch theo trạng thái ready yêu cầu.
- System giữ **Content Locale hiện tại** nếu target locale chưa sẵn sàng; không chuyển một phần content sang locale mới.

### 9. Extension Points

**None**

### 10. Triggers

Một trong hai trường hợp:

- Tourist chọn ngôn ngữ khi mới bắt đầu sử dụng ứng dụng.
- Tourist muốn đổi sang ngôn ngữ khác trong khi đang sử dụng hệ thống.

### 11. Assumptions

- Hệ thống có localization infrastructure.
- UI text và POI content được xử lý theo hai lane riêng.
- Startup có thể kích hoạt quá trình chọn locale nhưng **startup không phải UC riêng**.

### 12. Preconditions

**Initial selection:**

- Ứng dụng đang khởi động và Tourist đang ở pre-authentication flow.

**Runtime switching:**

- Ứng dụng đang hoạt động và Tourist có thể truy cập chức năng chọn locale.

### 13. Post Conditions

**Thành công:**

- Locale mới được áp dụng cho UI.
- Nội dung POI được cung cấp theo locale tương ứng khi dữ liệu sẵn sàng.
- Language switch đạt trạng thái hoàn tất khi các lane cần thiết đã ready.

**Không thành công:**

- Locale mới chưa thể hoàn tất do UI/content resource chưa ready.
- Giữ locale hiện tại và hiển thị thông báo lỗi ngắn gọn; Tourist có thể thử lại.

---

# UC05 — KHÁM PHÁ BẢN ĐỒ TƯƠNG TÁC

### 1. Use Case Number

**UC05**

### 2. Use Case Name

**Khám phá bản đồ tương tác**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist sử dụng bản đồ tương tác để quan sát khu vực tham quan, xem vị trí các POI và lựa chọn một POI để tiếp tục xem chi tiết.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist mở/chọn màn hình bản đồ tương tác sau khi đã authenticated. | System khởi tạo trạng thái bản đồ và chọn nguồn render phù hợp với trạng thái mạng/map pack hiện tại. |
| 2 | — | System hiển thị bản đồ khu vực tham quan bằng lớp bản đồ tương ứng. Runtime hỗ trợ MapLibre và PMTiles/local map pack khi phù hợp. #E5-1|
| 3 | — | System tải hoặc lấy từ cache dữ liệu POI khả dụng và hiển thị các POI trên bản đồ. Dữ liệu POI có thể được hydrate theo locale hiện tại. #E5-2|
| 4 | Tourist pan/zoom bản đồ để khám phá khu vực. #A5-1 #A5-2| System cập nhật viewport và trạng thái hiển thị bản đồ. Khi zoom-out tạo vùng có nhiều POI, lớp clustered POI có thể nhóm các POI thành cluster. |
| 5 | Tourist chọn một POI đơn lẻ trên bản đồ. | System xác định POI được chọn và mở điểm vào của giao diện POI Detail. |
| 6 | — | System chuyển sang **UC06 – Xem chi tiết POI** với POI đã chọn. |

### 7. Alternative Paths

### #A5-1. Tourist chọn một POI từ Cluster

**Điểm bắt đầu:** Basic Flow Step 4.

| Actor Action | System Response |
|---|---|
| Tourist chọn một cluster đang hiển thị nhiều POI. | System hiển thị danh sách/các POI thuộc cluster để Tourist lựa chọn. |
| Tourist chọn một POI cụ thể trong cluster. | System xác định POI được chọn và mở điểm vào của POI Detail. |
| — | Quay lại Basic Flow Step 6. |

### #A5-2. Tourist yêu cầu định vị vị trí hiện tại

**Điểm bắt đầu:** Basic Flow Step 4.

| Actor Action | System Response |
|---|---|
| Tourist chọn chức năng **Locate Me / Định vị vị trí của tôi**. | System kiểm tra quyền Geolocation của trình duyệt. |
| Tourist cho phép truy cập vị trí. #E5-3| System lấy vị trí hiện tại bằng LocationService và cập nhật vị trí người dùng trên bản đồ. |
| — | System có thể sử dụng cached position nếu đáp ứng điều kiện của `requestBestEffortPosition()`. |
| — | Tourist tiếp tục khám phá bản đồ. Quay lại Basic Flow Step 4. |

> `requestBestEffortPosition()` được sử dụng cho thao tác locate và vị trí được trả về gồm latitude, longitude và accuracy.

### 8. Exception Paths

### #E5-1. Không có nguồn bản đồ khả dụng

**Xảy ra tại:** Basic Flow Step 2.

**Nguyên nhân:**
- Nguồn cloud không khả dụng;
- không có active local map pack hoặc local map resources cần thiết.

**System Response:**
1. System thử cơ chế map fallback theo mode hiện tại.
2. Nếu vẫn không có nguồn bản đồ khả dụng, bản đồ không thể render đầy đủ.
3. System hiển thị thông báo tải bản đồ thất bại và cho phép Tourist tiếp tục với nguồn bản đồ/cached data hiện có nếu khả dụng.

### #E5-2. Không tải được POI data

**Xảy ra tại:** Basic Flow Step 3.

**Nguyên nhân:**
- Backend không phản hồi hoặc request POI thất bại.

**System Response:**
1. System sử dụng POI snapshot/cache hiện có nếu khả dụng.
2. Nếu không có dữ liệu POI khả dụng, bản đồ có thể được hiển thị mà không có POI tương ứng.
3. System hiển thị thông báo POI data không khả dụng; Tourist vẫn có thể tiếp tục với bản đồ đang hiển thị nếu có thể.

### #E5-3. Tourist từ chối quyền vị trí

**Xảy ra tại:** Alternative Path #A5-2.

**System Response:**
1. System không thể lấy vị trí hiện tại từ Geolocation.
2. Bản đồ tiếp tục hoạt động bằng trạng thái map hiện tại.
3. System giữ tâm bản đồ mặc định của khu vực tham quan; không tự xác định vị trí người dùng.

### 9. Extension Points

### 10. Triggers

Tourist muốn khám phá khu vực tham quan và tìm/chọn một POI trên bản đồ.

### 11. Assumptions

- Tourist đã hoàn tất **UC02 – Đăng nhập** và có authenticated session.
- Frontend map runtime được khởi tạo thành công ở mức tối thiểu.
- Dữ liệu POI hoặc nguồn cache cần thiết có thể được truy xuất.
- Map runtime có thể sử dụng cloud/local/hybrid theo trạng thái hệ thống.

### 12. Preconditions

1. Tourist has an authenticated/active session.
2. Tourist có quyền truy cập Tourist Core theo authorization hiện hành.
3. Dữ liệu bản đồ cần thiết phải khả dụng từ cloud, local pack hoặc cache; nếu không, xảy ra E1.

### 13. Post Conditions

**Thành công:**
- Bản đồ tương tác được hiển thị.
- POI khả dụng được hiển thị trên bản đồ.
- Tourist có thể tiếp tục khám phá hoặc chọn POI.
- Nếu chọn POI, hệ thống chuyển sang UC06 với POI tương ứng.

**Thất bại:**
- Tourist vẫn ở trong Tourist Core nhưng không thể sử dụng đầy đủ chức năng map nếu dữ liệu/nguồn map không khả dụng.

---

# UC06 — XEM CHI TIẾT POI

### 1. Use Case Number

**UC06**

### 2. Use Case Name

**Xem chi tiết POI**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist xem thông tin chi tiết của một POI đã chọn từ bản đồ hoặc nguồn POI khả dụng.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist chọn một POI từ bản đồ hoặc nguồn POI khả dụng. | System xác định POI cần xem. |
| 2 | — | System truy xuất dữ liệu chi tiết của POI hoặc sử dụng dữ liệu POI đã có trong client store/cache. #E6-1|
| 3 | — | System hiển thị các thông tin POI khả dụng, bao gồm tên, mô tả, hình ảnh và metadata được dữ liệu cung cấp. #A6-1 #E6-2|
| 4 | Tourist xem nội dung chi tiết của POI. #A6-2| System duy trì thông tin của POI đang được chọn và trạng thái giao diện tương ứng. |
| 5 | Tourist chọn chức năng nghe thuyết minh của POI, nếu audio khả dụng. #E6-3| System chuyển sang **UC07 – Nghe thuyết minh POI** thay vì lặp lại audio flow trong UC06. |

> Khi locale mục tiêu không khả dụng, System fallback về locale khả dụng theo chuỗi `Target locale → English → Vietnamese` và hiển thị thông báo fallback cho Tourist.

### 7. Alternative Paths

### #A6-1. POI có nhiều hình ảnh

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Tourist chọn/xem một hình ảnh khác của POI. | System hiển thị hình ảnh tương ứng trong giao diện POI Detail. |
| Tourist tiếp tục xem POI. | System giữ POI Detail hiện tại và quay lại Basic Flow Step 4. |

> POI Detail hiển thị tối đa **6 ảnh** trong **carousel**; chọn ảnh có thể mở **lightbox** để xem lớn hơn.

### #A6-2. Tourist chọn lại một POI khác

**Điểm bắt đầu:** Basic Flow Step 4.

| Actor Action | System Response |
|---|---|
| Tourist quay lại map và chọn một POI khác. | System đóng/đổi POI hiện tại và hiển thị detail của POI mới. |
| — | Flow được thực hiện lại từ Basic Flow Step 2 với POI mới. |

### 8. Exception Paths

### #E6-1. Không thể lấy chi tiết POI và không có dữ liệu local/cache

**Xảy ra tại:** Basic Flow Step 2.

**System Response:**
1. System không thể hoàn tất việc lấy detail.
2. Nếu không có dữ liệu local/cache có thể sử dụng, System không hiển thị đầy đủ POI Detail.
3. System hiển thị thông báo không thể tải đầy đủ POI Detail và giữ các dữ liệu local/cache có thể sử dụng.

### #E6-2. Localization của POI chưa có bản dịch hoàn chỉnh

**Xảy ra tại:** Basic Flow Step 3.

**System Response:**
1. System sử dụng localization fallback chain được hỗ trợ.
2. Target locale được ưu tiên nếu available.
3. Nếu không có, System có thể sử dụng English hoặc Vietnamese theo fallback chain.
4. System hiển thị thông báo/nhãn ngắn cho biết nội dung đang dùng **fallback locale**.

### #E6-3. Audio không khả dụng cho POI

**Xảy ra tại:** Basic Flow Step 5.

**System Response:**
1. System không thể bắt đầu UC07 với audio asset sẵn có.
2. Hệ thống có thể xử lý audio theo cơ chế fallback/on-demand nếu flow của UC07 áp dụng.
3. UC07 áp dụng cơ chế fallback audio đã chốt; UC06 chỉ cung cấp điểm vào để Tourist thực hiện nghe audio.

### 9. Extension Points

- **UC07 – Nghe thuyết minh POI**
- Hình ảnh nhiều ảnh/carousel: đã chốt tối đa 6 ảnh; UI dùng carousel và có thể mở lightbox.

### 10. Triggers

Tourist muốn tìm hiểu chi tiết về một POI cụ thể.

### 11. Assumptions

- Tourist có authenticated session.
- POI đã được chọn hợp lệ.
- Hệ thống có thể truy xuất POI từ client state/cache hoặc backend.
- Localization hiện tại có thể được áp dụng theo locale context của Tourist.

### 12. Preconditions

1. Tourist has an authenticated/active session.
2. Một POI hợp lệ đã được chọn hoặc đã được xác định từ flow trước.

### 13. Post Conditions

**Thành công:**
- Thông tin POI được hiển thị cho Tourist.
- Tourist có thể tiếp tục nghe audio bằng UC07 nếu có audio entry point.
- Tourist có thể quay lại map và chọn POI khác.

**Thất bại:**
- Không hiển thị đầy đủ POI Detail nếu cả backend và local/cache đều không có dữ liệu cần thiết.

---

# UC07 — NGHE THUYẾT MINH POI

### 1. Use Case Number

**UC07**

### 2. Use Case Name

**Nghe thuyết minh POI**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist chủ động lựa chọn nghe audio narration của một POI.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist đang xem một POI có entry point audio và chọn **Nghe thuyết minh**. | System xác định POI và locale audio cần sử dụng theo context hiện tại. |
| 2 | — | System kiểm tra audio narration khả dụng cho POI/locale hiện tại. #E7-1|
| 3 | — | Nếu audio asset khả dụng, System tải/đọc audio từ nguồn tương ứng. Pre-generated audio có thể được phục vụ qua cache. #E7-2 #E7-3|
| 4 | — | System khởi động playback của audio narration. #E7-2|
| 5 | Tourist nghe thuyết minh. | System duy trì trạng thái playback của audio hiện tại. |
| 6 | Tourist kết thúc việc nghe hoặc playback kết thúc. | System cập nhật trạng thái playback phù hợp và giữ Tourist tại POI Detail hoặc trạng thái UI tương ứng. |

### Audio resolution

Audio/Narration pipeline gồm:

1. Pre-generated audio (`audio_url`);
2. On-demand localization/TTS;
3. Realtime Cloud TTS;
4. Local/browser TTS.

Manual playback sử dụng **cơ chế fallback audio** của hệ thống khi nguồn ưu tiên không khả dụng.

### 7. Alternative Paths

> UC07 cung cấp các control playback cơ bản: **Play, Pause/Resume, Stop, Seek và Replay**; Volume do thiết bị/hệ điều hành quản lý, không có control riêng.

### 8. Exception Paths

### #E7-1. Audio asset không khả dụng

**Xảy ra tại:** Basic Flow Step 2.

**System Response:**
1. System xác định không có audio asset hợp lệ cho POI/locale hiện tại.
2. System có thể thử cơ chế fallback/on-demand nếu manual playback sử dụng cùng Audio pipeline.
3. Nếu không thể cung cấp audio, System thông báo/trạng thái lỗi phù hợp.
4. System thông báo audio không khả dụng và cho phép Tourist quay lại POI Detail hoặc thử lại.

### #E7-2. Audio loading/playback failure

**Xảy ra tại:** Basic Flow Step 3 và Step 4.

**System Response:**
1. System không thể hoàn tất playback từ nguồn hiện tại.
2. Nếu được hỗ trợ, System có thể chuyển sang fallback audio mechanism.
3. Nếu tất cả nguồn đều thất bại, playback không bắt đầu/không tiếp tục.
4. System thông báo lỗi playback, dừng trạng thái phát lỗi và cho phép Tourist **Retry** hoặc quay lại POI Detail.

### #E7-3. Network unavailable trong khi nguồn audio yêu cầu network

**Xảy ra tại:** Basic Flow Step 3.

**System Response:**
1. System kiểm tra cache/local fallback nếu available.
2. Nếu không có nguồn audio cục bộ phù hợp, audio không thể được phát theo nguồn network hiện tại.
3. Hệ thống giữ Tourist trong POI Detail.

### 9. Extension Points

- Audio/Narration pipeline.
- Fallback audio mechanisms.
- `UC04 – Chọn / Chuyển đổi ngôn ngữ` dưới dạng language context, không mặc định là `<<include>>`.

### 10. Triggers

Tourist muốn chủ động nghe thuyết minh của POI.

### 11. Assumptions

- Tourist có authenticated session.
- Tourist đã xác định một POI.
- POI có hoặc có thể được resolve tới một narration tương ứng.
- Audio Language được quản lý **độc lập với UI Language** theo quyết định cuối cùng.

### 12. Preconditions

1. Tourist has an authenticated/active session.
2. Một POI hợp lệ đã được chọn.
3. POI có audio entry point hoặc narration có thể được resolve.

### 13. Post Conditions

**Thành công:**
- Audio narration của POI được phát.
- Playback state được cập nhật theo trạng thái thực tế.

**Thất bại:**
- Audio không được phát nếu không có nguồn audio khả dụng hoặc tất cả cơ chế cần thiết đều thất bại.

---

# UC08 — NHẬN THUYẾT MINH TỰ ĐỘNG THEO VỊ TRÍ

### 1. Use Case Number

**UC08**

### 2. Use Case Name

**Nhận thuyết minh tự động theo vị trí**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist nhận audio narration tự động khi vị trí thiết bị thỏa điều kiện của một POI Geofence.

### Pipeline:

`GPS → GeofenceEngine → debounce → audio decision → NarrationEngine → audio playback`

Các hằng số/behavior gồm:
- Geofence radius: **30m**;
- GPS accuracy ≤ 15m
- GPS updates trong flow được throttle khoảng **5 giây**;
- **3 giây debounce** trước khi xác nhận ENTER;
- **5 phút cooldown** sau khi ra khỏi zone;
- Audio decision **không sử dụng audio priority**; audio trigger mới nhất thay thế audio đang chờ trước đó.
- Narration sử dụng fallback audio của hệ thống.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist di chuyển trong khu vực tham quan trong khi Tourist Core đang hoạt động. | LocationService tiếp nhận các position update theo cơ chế tracking của hệ thống. |
| 2 | — | System chuyển position vào `GeofenceEngine` và tính khoảng cách giữa vị trí Tourist và các POI bằng `turf.distance()`. #E8-1|
| 3 | — | Nếu vị trí nằm trong `geofence_radius` của một POI và chưa được xem là inside zone, System tạo trạng thái pending entry và bắt đầu debounce. Geofence default radius là 30m. #E8-1|
| 4 | Tourist tiếp tục ở trong vùng Geofence trong suốt thời gian debounce. | System xác nhận ENTER sau **3 giây debounce**. #E8-2 #E8-1|
| 5 | — | System thực hiện audio decision theo quy tắc cuối cùng. #A8-5|
| 6 | — | System chọn POI phù hợp và chuyển yêu cầu tới `NarrationEngine`. |
| 7 | — | System resolve narration/audio bằng Audio pipeline. Pre-generated `audio_url`, on-demand TTS/localization, realtime cloud TTS và local/browser TTS cho hybrid audio. #A8-2 #E8-7|
| 8 | — | System bắt đầu automatic narration và cập nhật trạng thái playback/POI UI. |
| 9 | — | Khi audio kết thúc, System nhận event kết thúc playback và cập nhật trạng thái giao diện/narration. |

### 7. Alternative Paths

### #A8-1. Nhiều Geofence của POI chồng lấn

**Điểm bắt đầu:** Basic Flow Step 5.

| Actor Action | System Response |
|---|---|
| Tourist di chuyển vào vùng mà nhiều POI cùng thỏa điều kiện Geofence. | System thực hiện audio decision đối với các active zones. |
| — | System áp dụng quy tắc lựa chọn POI hiện tại; nếu đã có audio đang chờ thì trigger mới nhất thay thế audio đang chờ trước đó. |
| — | Flow tiếp tục tại Basic Flow Step 6. |

**Lưu ý:** audio priority đã được loại bỏ khỏi mô hình nghiệp vụ cuối cùng.

### #A8-2. Audio của POI đã có trong cache/static source

**Điểm bắt đầu:** Basic Flow Step 7.

| Actor Action | System Response |
|---|---|
| Tourist tiếp tục ở vị trí hiện tại. | System không cần tạo audio mới nếu `audio_url` hợp lệ và nguồn cache/static khả dụng. |
| — | System sử dụng pre-generated audio và tiếp tục Basic Flow Step 8. |

### 8. Exception Paths

### #E8-1. GPS accuracy threshold không đạt yêu cầu

**Xảy ra tại:** Basic Flow Step 2 và Step 3.

- System kiểm tra độ chính xác GPS của vị trí hiện tại.
- Nếu GPS accuracy **> 15m**, System xác định vị trí chưa đủ chính xác để kích hoạt Auto Narration.
- System **không kích hoạt Auto Narration** cho POI tại thời điểm này.
- System tiếp tục theo dõi vị trí GPS và chỉ xử lý Auto Narration khi độ chính xác đạt ngưỡng yêu cầu (**≤ 15m**).
- UC08 tiếp tục.

### #E8-2. Tourist rời Geofence trong thời gian debounce

**Xảy ra tại:** Basic Flow Step 4.

1. System phát hiện vị trí không còn nằm trong zone đang pending.
2. Pending debounce bị hủy/reset.
3. Không xác nhận ENTER cho POI đó.
4. Nếu Tourist quay lại zone, một chu kỳ debounce mới có thể bắt đầu.

### #E8-3. Audio narration khác đang phát

**Xảy ra tại:** Basic Flow Step 5–7.

Không ngắt audio đang phát. Nếu đã có một narration chờ phát, narration mới thay thế narration đang chờ; chỉ giữ một narration pending.

### #E8-4. Tất cả nguồn narration khả dụng đều thất bại

**Xảy ra tại:** Basic Flow Step 7.

System thử các cơ chế audio được cấu hình trong pipeline. Nếu tất cả cơ chế cần thiết đều thất bại:

- narration không được phát;
- trạng thái playback phản ánh failure;
- System thông báo ngắn gọn rằng narration không thể phát và không lặp tự động trong cùng session.

### 9. Extension Points

- `NarrationEngine`
- `AudioQueueManager`
- Audio fallback pipeline
- POI localization/audio resolution

Các thành phần trên là implementation mechanisms, không tạo UC riêng.

### 10. Triggers

Vị trí Tourist thỏa điều kiện của một POI Geofence.

### 11. Assumptions

- Tourist đã authenticated.
- LocationService có thể nhận position updates.
- POI có tọa độ và `geofence_radius`.
- GeofenceEngine có thể tính khoảng cách.
- Audio narration có thể được resolve bằng một trong các cơ chế được hệ thống hỗ trợ.

### Re-trigger assumption

Quy tắc dự án: mỗi POI chỉ auto narration **một lần trong một session**. Không áp dụng cooldown/re-trigger riêng theo khoảng thời gian. Manual Play trong UC07 vẫn có thể phát lại.

### 12. Preconditions

1. Tourist has an authenticated/active session.
2. Location tracking/position acquisition đang hoạt động.
3. Các POI có thông tin vị trí và geofence cần thiết.
4. Tourist đang ở trong phạm vi mà hệ thống có thể xử lý location data.

### 13. Post Conditions

**Thành công:**
- Narration của POI phù hợp được trigger tự động.
- Audio playback bắt đầu hoặc được xử lý bởi fallback audio pipeline.
- Trạng thái POI/narration UI được cập nhật.
- Khi Tourist ra khỏi zone đã trigger, cooldown **5 phút**.

**Không thành công:**
- Không trigger narration nếu điều kiện Geofence không đạt.
- Không trigger nếu debounce không hoàn tất.
- Không phát audio nếu audio pipeline không thể cung cấp narration.

---
# UC09 — QUẢN LÝ DỮ LIỆU OFFLINE

### 1. Use Case Number

**UC09**

### 2. Use Case Name

**Quản lý dữ liệu Offline**

### 3. Actor(s)

**Tourist**

### 4. Maturity

**Focused**

### 5. Summary

Tourist quản lý dữ liệu offline cần thiết để ứng dụng có thể tiếp tục cung cấp nội dung tham quan khi thiết bị không có kết nối mạng.

### **Offline Bundle** explicit theo ngôn ngữ đang chọn, gồm bốn nhóm tài nguyên:

- map;
- POI snapshot;
- POI images;
- audio pack.

Map Pack và Audio Pack được quản lý riêng; không yêu cầu một thao tác cài đặt bundle duy nhất và asset được xác thực bằng SHA-256 trước khi activate. 
Cơ chế phát hiện update, `updateAvailable`, `repairRequired`, `poiMissing`, trạng thái bundle và offline resume shell.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Tourist mở khu vực/chức năng quản lý dữ liệu Offline. | System xác định trạng thái offline data hiện có và trạng thái của các offline resources. |
| 2 | — | System hiển thị trạng thái dữ liệu offline hiện tại, bao gồm tình trạng bundle/pack theo thông tin mà hệ thống có thể xác định. |
| 3 | Tourist chọn cài đặt/tải offline data cho ngôn ngữ hiện tại. | System xác định target offline bundle và kiểm tra trạng thái phiên bản/khả dụng của bundle. |
| 4 | — | System chuẩn bị cài đặt resource tương ứng: Map Pack hoặc Audio Pack. |
| 5 | — | System tải các tài nguyên cần thiết và cập nhật tiến độ cài đặt. |
| 6 | — | System xác thực integrity của asset trước khi đưa resource vào trạng thái sử dụng. |
| 7 | — | System activate/enable resource đã được xác thực và xác lập trạng thái offline tương ứng. |
| 8 | — | System hiển thị kết quả cài đặt/trạng thái offline cho Tourist. Use case kết thúc. |

### 7. Alternative Paths

### A1. Offline bundle đã tồn tại và có thể sử dụng

**Điểm bắt đầu:** Basic Flow Step 2.

| Actor Action | System Response |
|---|---|
| Tourist chọn tiếp tục sử dụng dữ liệu offline hiện có thay vì cài mới. | System sử dụng trạng thái bundle/pack hiện tại nếu resources vẫn hợp lệ. |
| — | System giữ bundle ở trạng thái sử dụng được và kết thúc thao tác cài đặt mới. |

**Quay lại:** Basic Flow Step 8.

### A2. Có phiên bản offline data mới

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Tourist chọn cập nhật offline data khi hệ thống phát hiện phiên bản mới. | System xác định target update và so sánh version/manifest fingerprint. |
| — | System thực hiện cài đặt/update theo cơ chế của offline pack/bundle và chỉ activate dữ liệu sau khi asset cần thiết được xác thực. |
| — | Quay lại Basic Flow Step 5. |

### A3. Tourist yêu cầu xóa/deactivate offline data đã cài

**Điểm bắt đầu:** Basic Flow Step 2.

| Actor Action | System Response |
|---|---|
| Tourist chọn thao tác xóa/deactivate một offline resource hoặc bundle. | System xử lý resource tương ứng theo cơ chế remove/deactivate được hệ thống hỗ trợ. |
| — | Trạng thái offline data được cập nhật sau khi tài nguyên được loại khỏi trạng thái active. |

**Không có thao tác xóa một Offline Bundle duy nhất. Tourist quản lý riêng Map Pack và Audio Pack theo ngôn ngữ.**

### A4. Dữ liệu đã có trong cache/local shell

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Tourist mở app trong trạng thái có offline data hợp lệ. | System có thể resume vào offline shell và sử dụng dữ liệu đã lưu thay vì chờ remote update checks. |

**Quay lại:** Basic Flow Step 8.

### 8. Exception Paths

### E1. Không đủ dung lượng để hoàn tất offline data installation

**Xảy ra tại:** Basic Flow Step 5–6.

**System Response:**
1. System không thể hoàn tất việc ghi tài nguyên cần thiết.
2. Cơ chế quota-aware purge có thể được kích hoạt theo implementation hiện có.
3. Trạng thái bundle không được coi là hoàn tất nếu các phần bắt buộc chưa sẵn sàng.
4. System thông báo không đủ dung lượng và cho phép Tourist thực hiện thao tác xóa Map Pack/Audio Pack trong UC09 để giải phóng dung lượng.

### E2. Remote manifest/update check không khả dụng

**Xảy ra tại:** Basic Flow Step 3.

**System Response:**
1. System có cơ chế chặn retry/update checks khi startup probe thất bại liên tiếp.
2. Nếu offline state hiện tại đã đủ để resume, System có thể vào offline shell.
3. System thông báo không thể kiểm tra/cập nhật remote; Tourist tiếp tục với offline data hiện tại nếu có, nếu không thì sử dụng ứng dụng ở trạng thái online khi kết nối trở lại.

### E3. Offline bundle có trạng thái không đầy đủ

**Xảy ra tại:** Basic Flow Step 6–7.

Các trạng thái như `repairRequired` hoặc `poiMissing`.

**System Response:**
1. System không coi bundle là fully ready.
2. System xác định resource còn thiếu/không hợp lệ.
3. System đưa ra trạng thái cần repair/update theo action summary.
4. System hiển thị trạng thái **thiếu/hỏng dữ liệu** và cung cấp action **Repair/Update** phù hợp; nếu resource không còn khả dụng, giữ trạng thái chưa usable.

### 9. Extension Points

- Offline Bundle installation/update.
- Map Pack activation/deactivation.
- Audio Pack management.
- Offline resume shell.

Các extension point trên là supporting mechanisms; không tạo thêm Use Case.

### 10. Triggers

Tourist muốn chuẩn bị, cập nhật, sử dụng hoặc quản lý dữ liệu tham quan khi offline.

### 11. Assumptions

- Tourist has an authenticated/active session.
- Offline resources có thể được chuẩn bị trước trên thiết bị.
- Offline data được quản lý riêng thành **Map Pack** và **Audio Pack**.
- Map/POI resources được giữ lại khi đổi Audio Language; nếu Audio Pack ngôn ngữ mới chưa có thì Tourist tải riêng Audio Pack đó.
- Không hỗ trợ Pause/Resume cho download.
- Map Pack và Audio Pack được xóa độc lập.

### 12. Preconditions

1. Tourist có authenticated/active session.
2. Chức năng Tourist Offline Management khả dụng.
3. Nếu Tourist cài hoặc cập nhật, target offline data phải tồn tại trên nguồn được hỗ trợ; nếu không, System báo không thể cài đặt/cập nhật.

### 13. Post Conditions

**Thành công:**
- Offline data được cài đặt/updated và chuyển sang trạng thái usable.
- Map Pack và Audio Pack được quản lý độc lập và chỉ đưa vào sử dụng sau khi resource tương ứng được xác thực.
- Tourist có thể tiếp tục sử dụng Tourist Core từ offline shell khi các resources tương ứng đã sẵn sàng.

**Không hoàn tất:**
- Bundle giữ trạng thái chưa hoàn chỉnh/repair-required nếu một hoặc nhiều phần bắt buộc chưa sẵn sàng.

---

# UC10 — QUẢN LÝ POI

### 1. Use Case Number

**UC10**

### 2. Use Case Name

**Quản lý POI**

### 3. Actor(s)

**Admin**

### 4. Maturity

**Focused**

### 5. Summary

Admin trực tiếp quản lý dữ liệu POI của hệ thống.

### Quyền hạn Admin
- `POIManagementPage` với CRUD POI;
- Create POI;
- Update POI;
- Delete POI;
- POI fields gồm thông tin nội dung, hình ảnh, tọa độ và `trigger_radius`;
- `poi_localizations` chứa localized content và `audio_url`;
- khi mô tả POI thay đổi, audio URL cũ có thể bị loại bỏ và audio status chuyển sang processing;
- activation/public availability có gate liên quan đến readiness của English/audio.


### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Admin mở chức năng **Quản lý POI** trong Admin Dashboard. | System xác thực phiên quản trị và quyền phù hợp cho POI management. |
| 2 | — | System hiển thị danh sách POI có thể quản lý. |
| 3 | Admin chọn một POI hoặc chọn thao tác tạo POI mới. | System hiển thị dữ liệu/form tương ứng với thao tác được chọn. |
| 4 | Admin xem hoặc chỉnh sửa thông tin POI, tùy thao tác. | System tiếp nhận thông tin POI mà Admin đang quản lý. |
| 5 | Admin lưu thay đổi. | System kiểm tra các điều kiện dữ liệu mà backend quy định và thực hiện operation tương ứng. |
| 6 | — | System cập nhật dữ liệu POI và trạng thái dữ liệu liên quan. |
| 7 | — | Nếu thay đổi POI ảnh hưởng đến audio generation/readiness theo flow của hệ thống, System cập nhật trạng thái audio liên quan và có thể đưa audio processing vào Audio Task flow. |
| 8 | — | System xác nhận kết quả operation và cập nhật danh sách POI. Use case kết thúc. |

### POI data

- name;
- description;
- category;
- location;
- images;
- `trigger_radius`;
- localization;
- `audio_url`;
- `audio_status`.

### 7. Alternative Paths

### A1. Create POI

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Admin chọn tạo POI mới. | System hiển thị form tạo POI. |
| Admin nhập thông tin POI và lưu. | System tạo POI theo backend content service. |
| — | System cập nhật dataset/version state liên quan và trả kết quả tạo thành công. |
| — | Quay lại Basic Flow Step 8. |

> **Validation:** name, description, category, location/coordinates, images và dữ liệu localization cần thiết phải hợp lệ; `trigger_radius` dùng giá trị hợp lệ; POI không được trùng theo rule duplicate của hệ thống.

### A2. View POI

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Admin chọn một POI để xem. | System hiển thị thông tin POI hiện tại. |
| — | Admin xem nội dung POI. |
| — | Use case quay lại trạng thái quản lý POI. |

**Quay lại:** Basic Flow Step 2 hoặc Step 8.

### A3. Update POI

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Admin chọn chỉnh sửa POI. | System hiển thị dữ liệu hiện tại của POI để chỉnh sửa. |
| Admin cập nhật dữ liệu và lưu. | System cập nhật POI. |
| — | Nếu mô tả thay đổi, audio URL cũ có thể bị xóa và `audio_status` chuyển sang `processing`; việc tạo audio được chuyển sang audio processing flow. |
| — | Quay lại Basic Flow Step 8. |

### A4. Delete POI

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Admin chọn xóa POI. | System thực hiện delete operation theo content service. |
| — | System cascade delete dữ liệu localization liên quan và enqueue media cleanup theo behavior. |
| — | Dataset version được cập nhật. |
| — | Quay lại Basic Flow Step 8. |

### A5. Toggle / Publish availability

**Điểm bắt đầu:** Basic Flow Step 3 hoặc Step 8.

Source có `poi:toggle` permission và mô tả activation gate.

| Actor Action | System Response |
|---|---|
| Admin thay đổi trạng thái availability của POI. | System kiểm tra readiness cần thiết cho public availability. |
| — | Nếu POI chưa đạt readiness yêu cầu, System không cho public availability và giữ resource ở trạng thái cần xử lý theo activation gate. |
| — | Nếu đủ điều kiện, trạng thái public/active được cập nhật. |

> Admin có action **Publish/Unpublish** ngay trong màn hình quản lý POI; trạng thái hiển thị rõ `Published/Unpublished`.

### A6. Update image data

**Điểm bắt đầu:** Basic Flow Step 4.

| Actor Action | System Response |
|---|---|
| Admin thay đổi dữ liệu hình ảnh của POI trong thao tác Update. | System lưu POI update; cơ chế cleanup orphan images khi update. |
| — | Quay lại Basic Flow Step 7. |

> Image manager hỗ trợ **thêm/xóa ảnh và sắp xếp thứ tự ảnh**, tối đa **6 ảnh** theo quyết định của POI Detail.

### 8. Exception Paths

### E1. POI không tồn tại khi Admin thực hiện view/update/delete

**Xảy ra tại:** Basic Flow Step 3 hoặc các alternative tương ứng.

**System Response:**
1. System không thể hoàn tất operation với POI đã chọn.
2. System trả trạng thái lỗi/not found.
3. Admin được đưa về danh sách POI.

### E2. Dữ liệu POI không hợp lệ

**Xảy ra tại:** Basic Flow Step 5.

**System Response:**
1. Operation không được hoàn tất.
2. System trả lỗi validation từ backend.
3. Admin có thể chỉnh sửa dữ liệu và thử lại.

> **Validation:** các field bắt buộc phải có giá trị; tọa độ phải hợp lệ; dữ liệu ảnh/localization phải đúng định dạng; kiểm tra duplicate trước khi lưu/publish.

### E3. Không thể hoàn tất POI update/delete

**Xảy ra tại:** Basic Flow Step 6.

**System Response:**
1. System giữ dữ liệu ở trạng thái trước operation nếu transaction không hoàn tất.
2. System báo operation failure.
3. Admin quay lại màn hình quản lý POI.

System hiển thị lỗi thao tác, không coi update/delete là thành công và cho phép Admin quay lại danh sách để thử lại.

### E4. POI chưa đạt readiness để public

**Xảy ra tại:** Alternative Path A5.

**System Response:**
1. System không activate/public POI.
2. System giữ POI ở trạng thái chưa sẵn sàng.
3. POI cần được xử lý audio/content trước khi public theo activation gate.

### E5. Audio processing được khởi tạo sau POI update

**Xảy ra tại:** Alternative Path A3.

**System Response:**
1. System cập nhật audio-related status.
2. Audio processing chuyển sang Audio Task workflow.
3. UC10 không theo dõi tiến độ chi tiết của task; việc đó thuộc UC11.

### 9. Extension Points

- POI localization/content pipeline.
- Audio Task processing sau POI change.
- Public activation/readiness gate.

### 10. Triggers

Admin muốn tạo, xem, sửa, xóa hoặc thay đổi trạng thái availability của POI.

### 11. Assumptions

- Admin has an authenticated/active administrative session.
- Admin có quyền POI phù hợp.
- POI data được quản lý trực tiếp trong hệ thống.
- Không có POI Owner approval workflow.

### 12. Preconditions

1. Admin has an authenticated/active session.
2. Admin có permission phù hợp để thực hiện operation POI.
3. Với Update/View/Delete: POI mục tiêu phải tồn tại hoặc được client/backend xác định hợp lệ.

### 13. Post Conditions

**Create:**
- POI mới được lưu nếu operation thành công.

**Update:**
- POI data được cập nhật.
- Nếu update ảnh hưởng audio readiness, audio status được xử lý theo source.

**Delete:**
- POI bị xóa và localization/media cleanup liên quan được xử lý theo system flow.

**Availability:**
- POI được activate/deactivate theo activation gate nếu operation hợp lệ.

---

# UC11 — GIÁM SÁT TIẾN ĐỘ TẠO AUDIO

### 1. Use Case Number

**UC11**

### 2. Use Case Name

**Giám sát tiến độ tạo Audio**

### 3. Actor(s)

**Admin**

### 4. Maturity

**Focused**

### 5. Summary

Admin theo dõi quá trình xử lý các Audio tasks và trạng thái tiến độ tạo audio.


- `AudioTaskManager` là background engine;
- xử lý song song với Semaphore max = 3;
- real-time progress qua SSE `GET /admin/audio-tasks/stream`;
- frontend có progress bar;
- UC11 chỉ monitor trạng thái/progress; các control điều khiển task không thuộc scope cuối cùng;
- task states gồm `queued`, `running`, `paused`, `completed`, `failed`, `cancelled`;
- task state được lưu để hỗ trợ recovery sau restart.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Admin mở **Audio Task Manager**. | System kiểm tra phiên quản trị và quyền phù hợp. |
| 2 | — | System hiển thị danh sách Audio tasks cùng trạng thái hiện tại. |
| 3 | Admin chọn một Audio task cần theo dõi. | System hiển thị trạng thái/progress hiện tại của task. |
| 4 | — | System thiết lập/duy trì cơ chế nhận cập nhật tiến độ real-time qua SSE. |
| 5 | — | System gửi các cập nhật trạng thái/tiến độ của task tới giao diện. |
| 6 | Admin theo dõi tiến độ xử lý. | Giao diện cập nhật progress mà không cần Admin tải lại trang theo flow SSE. |
| 7 | — | Khi task chuyển trạng thái, System cập nhật trạng thái cuối hoặc trạng thái trung gian tương ứng. |
| 8 | — | Khi task đạt trạng thái kết thúc (`completed`, `failed` hoặc `cancelled`), System hiển thị trạng thái cuối và kết quả tiến độ hiện tại. |
| 9 | Admin xem trạng thái cuối của task. | Use case kết thúc. |

### Task states

- `queued`
- `running`
- `paused`
- `completed`
- `failed`
- `cancelled`

### 7. Alternative Paths

### A1. Pause task

**Điểm bắt đầu:** Basic Flow Step 6.

| Actor Action | System Response |
|---|---|
| Admin chọn **Pause**. | System kiểm tra trạng thái hiện tại của task. |
| — | Nếu trạng thái cho phép pause, processing không nhận thêm item mới theo behavior của task manager. |
| — | Task chuyển sang `paused` và progress hiện tại được bảo toàn theo task state. |
| — | Giao diện hiển thị trạng thái paused. |

### A2. Resume task

**Điểm bắt đầu:** Task đang `paused`.

| Actor Action | System Response |
|---|---|
| Admin chọn **Resume**. | System xác định task và phần processing còn lại. |
| — | Task tiếp tục xử lý và chuyển lại trạng thái `running`. |
| — | SSE tiếp tục cung cấp cập nhật progress. |
| — | Quay lại Basic Flow Step 6. |

### A3. Cancel task

**Điểm bắt đầu:** Basic Flow Step 6 hoặc task đang `paused`.

| Actor Action | System Response |
|---|---|
| Admin chọn **Cancel**. | System xử lý yêu cầu cancel của task. |
| — | Task chuyển sang `cancelled` theo task state model. |
| — | Các kết quả đã tạo trước thời điểm cancel được giữ theo lifecycle của task. |
| — | SSE phản ánh trạng thái cuối. |
| — | Quay lại Basic Flow Step 8. |

### A4. Task đã hoàn tất trước khi Admin mở màn hình

**Điểm bắt đầu:** Basic Flow Step 2.

| Actor Action | System Response |
|---|---|
| Admin mở Audio Task Manager sau khi task đã kết thúc. | System hiển thị state cuối (`completed`, `failed` hoặc `cancelled`). |
| — | Không cần chờ thêm processing event cho task đó. |
| — | Quay lại Basic Flow Step 9. |

### 8. Exception Paths

### E1. Admin không có permission phù hợp

**Xảy ra tại:** Basic Flow Step 1.

**System Response:**
1. System từ chối truy cập chức năng.
2. Giao diện thông báo quyền truy cập không phù hợp.
3. Use case kết thúc.

### E2. Audio task không tồn tại

**Xảy ra tại:** Basic Flow Step 3.

**System Response:**
1. System không thể mở task được chọn.
2. System refresh task list.
3. Admin quay lại danh sách task.

### E3. SSE connection bị gián đoạn

**Xảy ra tại:** Basic Flow Step 4–6.

**System Response:**
1. Real-time update không tiếp tục qua connection hiện tại.
2. Task processing phía server tiếp tục là behavior của background engine.
3. UI thực hiện **reconnect** tới stream trạng thái khi mất kết nối; sau khi kết nối lại, UI tải lại trạng thái task hiện tại.

### E4. Task chuyển sang failed

**Xảy ra tại:** Basic Flow Step 7.

**System Response:**
1. System cập nhật task thành `failed`.
2. Giao diện hiển thị task failure state.
3. UI hiển thị trạng thái `failed` và thông báo lỗi ở mức user-facing; chi tiết kỹ thuật không bắt buộc phải hiển thị.

### E5. Admin yêu cầu thao tác không phù hợp với task state

**Xảy ra tại:** A1, A2 hoặc A3.

**System Response:**
1. System từ chối operation.
2. System trả state hiện tại của task.
3. Giao diện cập nhật các action khả dụng theo trạng thái.

### 9. Extension Points

- `AudioTaskManager`
- SSE real-time progress stream
- Audio generation pipeline
- Task recovery after restart

### 10. Triggers

Admin muốn theo dõi trạng thái và tiến độ của một Audio task.

### 11. Assumptions

- Admin has an authenticated/active administrative session.
- Admin có permission phù hợp để truy cập Audio Task Manager.
- Audio task đã tồn tại hoặc được hệ thống tạo bởi một flow khác.
- Processing engine hoạt động ở background.

### 12. Preconditions

1. Admin has an authenticated/active session.
2. Admin có quyền phù hợp với Audio Task Manager.
3. Có ít nhất một Audio task để xem hoặc task identifier hợp lệ.

### 13. Post Conditions

**Monitoring thành công:**
- Admin nhìn thấy trạng thái và tiến độ hiện tại/final của task.
- UI phản ánh task state được system cung cấp.

**Pause:**
- Task ở `paused` nếu operation thành công.

**Resume:**
- Task tiếp tục ở `running` nếu operation thành công.

**Cancel:**
- Task ở `cancelled` nếu operation thành công.

---

# UC12 — QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

### 1. Use Case Number

**UC12**

### 2. Use Case Name

**Quản lý tài khoản người dùng**

### 3. Actor(s)

**Super Admin**

### 4. Maturity

**Focused**

### 5. Summary

Super Admin quản lý các user accounts trong phạm vi quyền account-management của hệ thống.

- Admin Dashboard có `UsersManagementPage`;
- Dashboard mô tả `CRUD: POIs, Users, Roles, Menus`;
- permission registry có `user:read`, `user:create`, `user:update`, `user:delete`;
- role `super_admin` có tất cả permissions;
- role `admin` có phạm vi `User` trong permission summary.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Super Admin chọn mục **Quản lý người dùng** trên khu vực quản trị. | System xác thực phiên quản trị và quyền truy cập phù hợp. |
| 2 | — | System hiển thị danh sách user accounts có thể quản lý. |
| 3 | Super Admin chọn một account hoặc chọn thao tác quản lý account. | System hiển thị thông tin account/operation tương ứng. |
| 4 | Super Admin xem hoặc thay đổi thông tin account theo operation được hỗ trợ. | System tiếp nhận thay đổi. |
| 5 | Super Admin xác nhận operation. | System kiểm tra quyền và tính hợp lệ của operation/account data. |
| 6 | — | System cập nhật dữ liệu account. |
| 7 | — | System hiển thị kết quả operation và cập nhật danh sách users. Use case kết thúc. |

### CRUD

- `user:read`
- `user:create`
- `user:update`
- `user:delete`

và Admin Dashboard mô tả **CRUD Users**.


### 7. Alternative Paths

### A1. View user account

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn một user account để xem. | System hiển thị dữ liệu account hiện tại. |
| — | Super Admin xem thông tin account. |

**Quay lại:** Basic Flow Step 7.

### A2. Create user account

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn tạo user account. | System hiển thị form tạo account. |
| Super Admin nhập dữ liệu account và xác nhận. | System kiểm tra và tạo account theo quyền `user:create`. |
| — | System hiển thị account vừa tạo. |
| — | Quay lại Basic Flow Step 7. |

> **Form fields:** Username, Password/Confirm Password khi tạo mới, và các thông tin account mà UI User Management hỗ trợ. Username tuân theo cùng validation của UC01.

### A3. Update user account

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn chỉnh sửa account. | System hiển thị thông tin hiện tại. |
| Super Admin cập nhật dữ liệu và xác nhận. | System kiểm tra và lưu account update theo quyền `user:update`. |
| — | System cập nhật danh sách users. |
| — | Quay lại Basic Flow Step 7. |

### A4. Delete user account

**Điểm bắt đầu:** Basic Flow Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn xóa account. | System xử lý delete operation theo quyền `user:delete`. |
| — | System xóa account nếu operation hợp lệ. |
| — | System cập nhật danh sách users. |
| — | Quay lại Basic Flow Step 7. |

> Xóa tài khoản theo **soft delete**; UI có bước xác nhận trước khi thực hiện.

### A5. Account operation does not require RBAC modification

**Điểm bắt đầu:** Basic Flow Step 4.

| Actor Action | System Response |
|---|---|
| Super Admin thay đổi account data không thuộc role/permission configuration. | System xử lý trong phạm vi UC12. |
| — | Role/permission management không được thực hiện trong UC12. |

### 8. Exception Paths

### E1. User account không tồn tại

**Xảy ra tại:** Basic Flow Step 3.

**System Response:**
1. System không tìm thấy account mục tiêu.
2. System refresh danh sách.
3. Super Admin quay lại user list.

### E2. Account data không hợp lệ

**Xảy ra tại:** Basic Flow Step 5.

**System Response:**
1. System từ chối operation.
2. System trả lỗi validation.
3. Super Admin chỉnh sửa dữ liệu và thử lại.

> Validation sử dụng cùng các ràng buộc account/Username đã chốt tại UC01; dữ liệu bắt buộc phải đầy đủ và hợp lệ.

### E3. Duplicate account

**Xảy ra tại:** A2.

→ System báo tài khoản đã tồn tại/Username đã được sử dụng và yêu cầu nhập giá trị khác.

### E4. Delete operation không thể hoàn tất

**Xảy ra tại:** A4.

→ System báo thao tác không thể hoàn tất và giữ nguyên dữ liệu; không hard-delete.

### E5. Operation không thuộc scope của UC12

**Xảy ra tại:** Basic Flow Step 4.

**System Response:**
1. System chuyển operation sang chức năng/Use Case tương ứng nếu UI hỗ trợ navigation.
2. Không thực hiện role/RBAC logic trong UC12.

### 9. Extension Points

- User Management.
- Authentication/admin authorization gate.
- UC13 – Quản lý tài khoản Admin.
- UC14 – Quản lý vai trò và phân quyền.
- UC16 – Audit Log nếu account changes được ghi audit.

### 10. Triggers

Super Admin muốn xem hoặc quản lý user accounts.

### 11. Assumptions

- Super Admin has an authenticated/active administrative session.
- Super Admin có quyền user management.
- User accounts tồn tại trong account domain mà hệ thống expose cho Users Management.
- RBAC changes được quản lý bởi UC14, không phải mục tiêu chính của UC12.

### 12. Preconditions

1. Super Admin has an authenticated/active session.
2. Super Admin có permission phù hợp cho User Management.
3. Nếu thao tác View/Update/Delete: account mục tiêu phải tồn tại.

### 13. Post Conditions

**Create:**
- User account được tạo nếu operation thành công.

**Read:**
- User account information được hiển thị.

**Update:**
- Account data được cập nhật.

**Delete:**
- Account được **soft-delete** nếu operation thành công.

**RBAC boundary:**
- Role/permission configuration không bị thay đổi bởi UC12 nếu operation không bao gồm phần đó.

---

# UC13 — QUẢN LÝ TÀI KHOẢN ADMIN

### 1. Use Case Number

**UC13**

### 2. Use Case Name

**Quản lý tài khoản Admin**

### 3. Actor(s)

**Super Admin**

### 4. Maturity

**Focused**

### 5. Summary

Super Admin quản lý các tài khoản được sử dụng cho phạm vi Admin của hệ thống.

- `admin_users` là collection chứa tài khoản admin/owner, kèm hashed password, role và các thuộc tính liên quan.
- `UsersManagementPage` được mô tả là **CRUD Users**.
- Permission domain `user` có `read`, `create`, `update`, `delete`.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Super Admin chọn chức năng **Quản lý tài khoản Admin**. | Hệ thống mở khu vực quản lý tài khoản người dùng thuộc phạm vi quản trị. |
| 2 | — | Hệ thống hiển thị danh sách các tài khoản trong phạm vi quản lý và cung cấp các thao tác CRUD được hệ thống hỗ trợ. **Phạm vi chỉ gồm tài khoản role `admin`.** |
| 3 | Super Admin chọn một tài khoản Admin cần xem hoặc chỉnh sửa. | Hệ thống tải và hiển thị thông tin tài khoản mà màn hình quản lý hỗ trợ. |
| 4 | Super Admin thực hiện thao tác quản lý tài khoản phù hợp. | Hệ thống xử lý thao tác tương ứng theo chức năng được chọn. |
| 5 | — | Hệ thống cập nhật danh sách/kết quả sau thao tác. Use case kết thúc. |

### 7. Alternative Paths

### A1. Tạo tài khoản trong phạm vi Admin

**Điểm bắt đầu:** Basic Course Step 2.

| Actor Action | System Response |
|---|---|
| Super Admin chọn thao tác **Tạo tài khoản**. | Hệ thống hiển thị form tạo user/account theo dữ liệu mà chức năng quản lý hỗ trợ. |
| Super Admin nhập và gửi thông tin tài khoản. | Hệ thống thực hiện thao tác tạo user theo cơ chế CRUD của `UsersManagementPage`/`user:create`. |
| — | Hệ thống cập nhật danh sách tài khoản. Use case quay lại Basic Course Step 2. |

> Tài khoản Admin mới **mặc định role `admin`**. Thay đổi role thuộc UC14.

### A2. Chỉnh sửa tài khoản Admin

**Điểm bắt đầu:** Basic Course Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin thay đổi thông tin của tài khoản đã chọn. | Hệ thống thực hiện cập nhật tài khoản theo chức năng `user:update`. |
| — | Hệ thống hiển thị kết quả cập nhật và làm mới thông tin tài khoản. |
| — | Quay lại Basic Course Step 2. |

> Các field account được phép chỉnh sửa theo form quản lý Admin; role không chỉnh tại UC13.

### A3. Xóa tài khoản Admin

**Điểm bắt đầu:** Basic Course Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn thao tác **Xóa** đối với tài khoản. | Hệ thống yêu cầu xác nhận rồi thực hiện soft-delete theo chức năng `user:delete`. |
| — | Hệ thống cập nhật danh sách tài khoản sau khi thao tác hoàn tất. Use case quay lại Basic Course Step 2. |

### Ngoài phạm vi

- **Activate/Deactivate:** được hỗ trợ trong UC13 cho Admin accounts.
- **Reset password:** Super Admin có thể reset password cho Admin account.
- **Gán role trong UC13:** không đặc tả ở đây.

### 8. Exception Paths

### E1. Tài khoản được chọn không còn tồn tại

**Xảy ra khi:** Basic Course Step 3 hoặc Alternative Path A2/A3.

**Xử lý:** System thông báo tài khoản không còn tồn tại và làm mới danh sách.

### E2. Thao tác CRUD thất bại

**Xử lý cụ thể:** System hiển thị lỗi thao tác và cho phép Super Admin thử lại; không coi thao tác thất bại là thành công.

### 9. Extension Points

### 10. Triggers

Super Admin có nhu cầu xem hoặc thay đổi các tài khoản thuộc phạm vi Admin.

### 11. Assumptions

- Super Admin đã được xác thực để truy cập vùng quản trị.
- Chức năng user management của hệ thống đang khả dụng.
- Tài khoản Admin được biểu diễn trong mô hình account/role của hệ thống.

### 12. Preconditions

1. Super Admin có phiên xác thực hợp lệ để truy cập Admin area.
2. Chức năng **Quản lý tài khoản Admin** khả dụng như một mục quản trị riêng.
3. Account mục tiêu thuộc boundary `role = admin`.

### 13. Post Conditions

**Khi xem:** Danh sách/thông tin tài khoản trong phạm vi quản lý được hiển thị.

**Khi tạo thành công:** Một account mới được tạo trong hệ thống theo phạm vi được hỗ trợ.

**Khi cập nhật thành công:** Dữ liệu account được cập nhật.

**Khi xóa thành công:** Account được **soft-delete** và không còn được xem là account hoạt động trong phạm vi quản lý.

**Activate/Deactivate:** được hỗ trợ trong UC13. **Reset password:** Super Admin có thể reset password cho Admin account theo quyết định của đặc tả.

---

# UC14 — QUẢN LÝ VAI TRÒ VÀ PHÂN QUYỀN (RBAC)

### 1. Use Case Number

**UC14**

### 2. Use Case Name

**Quản lý vai trò và phân quyền (RBAC)**

### 3. Actor(s)

**Super Admin**

### 4. Maturity

**Focused**

### 5. Summary

Super Admin quản lý các role động và tập permission mà hệ thống sử dụng cho RBAC.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Super Admin chọn chức năng **Quản lý vai trò và phân quyền**. | Hệ thống mở khu vực quản lý role. |
| 2 | — | Hệ thống hiển thị danh sách role mà hệ thống đang hỗ trợ. |
| 3 | Super Admin chọn một role. | Hệ thống hiển thị cấu hình permission hiện có của role được chọn. |
| 4 | Super Admin thay đổi tập permission của role. | Hệ thống cập nhật cấu hình permission đang được chỉnh sửa. |
| 5 | Super Admin chọn **Lưu**. | Hệ thống lưu permission array của role. |
| 6 | — | Hệ thống thông báo kết quả và hiển thị cấu hình role sau khi cập nhật. Use case kết thúc. |

### RBAC vocabulary

Permission domains:

| Domain | Permissions |
|---|---|
| `poi` | `read`, `create`, `update`, `delete`, `approve`, `toggle` |
| `menu` | `read`, `create`, `update`, `delete` |
| `user` | `read`, `create`, `update`, `delete` |
| `role` | `read`, `create`, `update`, `delete` |
| `analytics` | `view`, `export`, `view_own` |
| `audit` | `read`, `manage` |
| `system` | `config`, `logs`, `backup` |
| `owner` | `register`, `access`, `submit_poi`, `manage_own_poi` |
| `content` | `moderate`, `publish` |

> **Không coi `permission` là một entity CRUD độc lập trong UC14**.

### 7. Alternative Paths

### A1. Tạo Role

**Điểm bắt đầu:** Basic Course Step 2.

| Actor Action | System Response |
|---|---|
| Super Admin chọn **Tạo role**. | Hệ thống mở thao tác tạo role. |
| Super Admin nhập dữ liệu role và thiết lập permission array. | Hệ thống tiếp nhận cấu hình role. |
| Super Admin lưu role. | Hệ thống thực hiện create role theo chức năng CRUD Roles. |
| — | Hệ thống cập nhật danh sách role. Quay lại Basic Course Step 2. |

> Role name không để trống, role name phải duy nhất; permission array chỉ được chứa các permission tồn tại trong static permission registry.

### A2. Chỉnh sửa Role

**Điểm bắt đầu:** Basic Course Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin thay đổi thông tin role hoặc permission array. | Hệ thống cập nhật dữ liệu đang chỉnh sửa. |
| Super Admin lưu thay đổi. | Hệ thống thực hiện update role. |
| — | Danh sách/cấu hình role được cập nhật. Quay lại Basic Course Step 2. |

### A3. Xóa Role

**Điểm bắt đầu:** Basic Course Step 3.

| Actor Action | System Response |
|---|---|
| Super Admin chọn **Xóa role**. | Hệ thống thực hiện thao tác delete role theo CRUD Roles. |
| — | Hệ thống cập nhật danh sách role. Quay lại Basic Course Step 2. |

>System role và role đang được sử dụng **không được xóa**; UI thông báo lý do và yêu cầu chọn role khác/không xóa.

### A4. Permission definitions không được coi là CRUD

### Ngoài phạm vi

- Mỗi account chỉ có **một role**.
- Không có UI gán permission trực tiếp cho account; role là cơ chế chính.
- Thay đổi role thuộc **UC14**; Admin mới mặc định role `admin` trong UC13.
- Khi thay đổi role, System kiểm tra dữ liệu role/permission theo cấu hình RBAC.
- **Không áp dụng constraint bảo vệ “Super Admin cuối cùng”** trong phạm vi đặc tả này.

### 8. Exception Paths

### E1. Cấu hình role không được lưu

**Xử lý:** System hiển thị thông báo lỗi và cho phép actor thử lại; vì đây là thao tác xem, không có dữ liệu nhập cần giữ lại.

### E2. Role/permission state không còn hợp lệ

**Xử lý:** System hiển thị thông báo lỗi và cho phép Super Admin thử lại; không thay đổi dữ liệu hiện có.

### 9. Extension Points

### 10. Triggers

Super Admin muốn thay đổi role hoặc cấu hình permission của role.

### 11. Assumptions

- Super Admin đã được xác thực.
- Role configuration được lưu trong dynamic roles store.
- Permission definitions hiện hành của hệ thống được cung cấp bởi static permission registry.
- Việc enforcement được thực hiện ở các protected operation khác; UC14 chỉ quản lý cấu hình RBAC.

### 12. Preconditions

1. Super Admin có quyền truy cập chức năng RBAC.
2. Hệ thống có role store/configuration.
3. Permission registry hiện hành khả dụng.

### 13. Post Conditions

**Khi tạo:** Role mới được lưu trong role store, với permission array theo cấu hình được chấp nhận.

**Khi cập nhật:** Permission array/role configuration được cập nhật.

**Khi xóa:** Role được xóa nếu thao tác được hệ thống chấp nhận.

**Permission definitions:** là tập permission tĩnh; UC14 chỉ quản lý việc gán permission thông qua Role, không tạo/xóa permission definition.

---

# UC15 — XEM ANALYTICS

### 1. Use Case Number

**UC15**

### 2. Use Case Name

**Xem Analytics**

### 3. Actor(s)

**Admin, Super Admin**

### 4. Maturity

**Focused**

### 5. Summary

Admin và Super Admin xem các dữ liệu Analytics mà hệ thống cung cấp trên Admin Dashboard.

- Có `analytics` router/lane.
- Có read models cho analytics.
- Dashboard lấy dữ liệu từ daily metrics và POI daily metrics, đồng thời lấy số online từ presence service.
- Output dashboard:
  - `today_views`
  - `audio_plays`
  - `searches`
  - `top_pois`
  - `tracked_online_users`
- Analytics là **consent-gated**; `tracked_online_users` là số anonymous device đã consent còn trong sliding window hiện tại, không phải tổng traffic hay số tab đang mở.
- Permission domain `analytics` gồm `view`, `export`, `view_own`.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Admin hoặc Super Admin chọn chức năng **Analytics**. | Hệ thống mở dashboard Analytics trong vùng quản trị. |
| 2 | — | Hệ thống tải các read model/dữ liệu Analytics được dùng cho dashboard. |
| 3 | — | Hệ thống tổng hợp dữ liệu cần thiết cho dashboard, bao gồm dữ liệu daily/POI metrics và trạng thái online được phép theo semantics Analytics. |
| 4 | — | Hệ thống hiển thị các số liệu dashboard: `today_views`, `audio_plays`, `searches`, `top_pois`, `tracked_online_users`. |
| 5 | Admin hoặc Super Admin xem các số liệu Analytics. | Hệ thống duy trì kết quả hiển thị theo dữ liệu read model hiện có. Use case kết thúc. |

### Metric semantics

- `today_views`: số lượt xem được read model cung cấp cho dashboard.
- `audio_plays`: số lượt phát audio được read model cung cấp.
- `searches`: số lượt search được read model cung cấp.
- `top_pois`: nhóm POI đứng đầu theo metric dashboard được source trả ra.
- `tracked_online_users`: anonymous devices đã consent còn trong sliding window hiện tại.

> Dashboard sử dụng **stat cards**, hỗ trợ **date range** và các filter: **POI, device, language, region, event type**. Exact aggregation formula/time window chỉ áp dụng theo dữ liệu read model mà đã được cung cấp; không tự định nghĩa công thức mới.

### 7. Alternative Paths

### A1. Hệ thống hiển thị dữ liệu Analytics read model

**Điểm bắt đầu:** Basic Course Step 2.

| Actor Action | System Response |
|---|---|
| — | Hệ thống lấy dữ liệu từ các Analytics read models và hiển thị kết quả đã được định nghĩa. |

Quay lại Basic Course Step 4.

### Không đưa các thao tác sau thành Alternative Path

- **Filter theo date range:** đã chốt.
- **Filter theo POI/device/language/region/event type:** đã chốt.
- **Drill-down:** không có.
- **Export:** không có trong UC15.
- **Chart:** không có; dashboard chỉ dùng **stat cards**.

### 8. Exception Paths

### E1. Analytics data source/read model không sẵn sàng

**Xử lý:** System hiển thị thông báo lỗi và cho phép Super Admin thử lại; không thay đổi dữ liệu hiện có.

### E2. Actor không có quyền Analytics

Nếu quyền không cho phép truy cập tại runtime, UI thông báo không có quyền truy cập Analytics.

### 9. Extension Points

### 10. Triggers

Admin hoặc Super Admin muốn xem số liệu Analytics của hệ thống.

### 11. Assumptions

- Actor đã được xác thực.
- Actor được phép truy cập Analytics theo RBAC.
- Analytics pipeline/read models có dữ liệu khả dụng.
- Public analytics chỉ ingest dữ liệu theo cơ chế consent-gated.

### 12. Preconditions

1. Admin hoặc Super Admin đã ở trong vùng quản trị hợp lệ.
2. Có quyền `analytics:view` theo RBAC hiện hành.
3. Analytics read models/lane đang khả dụng.

### 13. Post Conditions

- Dashboard Analytics được hiển thị với các metric được hỗ trợ.
- Không thay đổi dữ liệu Analytics chỉ bằng hành động xem.
- Audit Log không bị trộn vào kết quả Analytics của UC15.

---

# UC16 — XEM AUDIT LOG

### 1. Use Case Number

**UC16**

### 2. Use Case Name

**Xem Audit Log**

### 3. Actor(s)

**Super Admin**

### 4. Maturity

**Focused**

### 5. Summary

Super Admin truy xuất và xem các bản ghi Audit Log được hệ thống lưu.

- Có `AuditLogsPage — Nhật ký hoạt động`.
- Có collection `audit_logs`.
- Audit record với các thông tin:
  - `action`
  - `user_id`
  - `resource`
  - `timestamp`
- Permission domain `audit` có `read` và `manage`.
- Admin Dashboard có khu vực giám sát Audit Logs.

### 6. Basic Course of Events

| Step | Actor Action | System Response |
|---|---|---|
| 1 | Super Admin chọn chức năng **Audit Logs**. | Hệ thống mở trang Audit Logs. |
| 2 | — | Hệ thống truy xuất các audit records được lưu trong `audit_logs`. |
| 3 | — | Hệ thống hiển thị danh sách audit records với các trường: action, user_id, resource, timestamp. |
| 4 | Super Admin xem các bản ghi Audit Log. | Hệ thống duy trì danh sách theo dữ liệu audit đang có. Use case kết thúc. |

### Không mô tả:

- cách tạo audit record;
- cơ chế lưu trữ;
- retention;
- xóa log;
- cấu hình audit;
- backup log.

### 7. Alternative Paths

### A1. Truy xuất danh sách Audit Log hiện có

**Điểm bắt đầu:** Basic Course Step 2.

| Actor Action | System Response |
|---|---|
| — | Hệ thống trả về danh sách audit records đang có để hiển thị trên AuditLogsPage. |

Quay lại Basic Course Step 3.

### Các thao tác

- Search: **có**.
- Filter: **có**.
- Sort: **có**.
- Pagination: **có**.
- Detail view: **không có**.
- Export: **không có**.

### 8. Exception Paths

### E1. Audit records không truy xuất được

**Xử lý:** System hiển thị thông báo lỗi và cho phép Super Admin thử lại; không thay đổi dữ liệu hiện có.

### E2. Không có Audit Log phù hợp/không có dữ liệu

**Xử lý:** System hiển thị thông báo lỗi và cho phép Super Admin thử lại; không thay đổi dữ liệu hiện có.

### 9. Extension Points

### 10. Triggers

Super Admin muốn kiểm tra các hoạt động đã được hệ thống ghi nhận trong Audit Log.

### 11. Assumptions

- Super Admin đã được xác thực.
- Audit log data đang khả dụng.
- Audit record schema ít nhất hỗ trợ các trường đã công bố.

### 12. Preconditions

1. Super Admin có quyền truy cập Audit Logs theo mô hình RBAC.
2. Audit log store/collection khả dụng.
3. `AuditLogsPage` khả dụng trong vùng Admin.

### 13. Post Conditions

- Danh sách audit records được hiển thị cho Super Admin.
- Dữ liệu Audit Log không bị thay đổi bởi thao tác xem.

---

# DEPENDENCY / RELATIONSHIP

| Source | Relationship | Target | Purpose |
|---|---|---|---|
| UC01 | creates account for | UC02 | Sau khi đăng ký, Tourist dùng tài khoản để Login. |
| UC02 | precondition/state dependency | UC03, UC05–UC08 | Các chức năng cần authenticated session. |
| UC04 | language context/dependency | UC06–UC08 | UI/Content Language ảnh hưởng POI content; Audio Language độc lập. |
| UC05 | navigates/selects | UC06 | Tourist chọn POI trên map để xem detail. |
| UC06 | invokes/accesses | UC07 | POI Detail cung cấp entry point cho manual audio. |
| UC08 | uses/reuses | audio mechanism | Auto narration dùng cơ chế audio nhưng không merge với UC07. |
| UC09 | supports continuation | UC05–UC08 | Offline Map/Audio Packs hỗ trợ Tourist tiếp tục sử dụng chức năng khi offline theo resource đã cài. |
| UC10 | provides POI data | UC06 | POI data do Admin quản lý được Tourist xem. |
| UC10 | provides audio/POI state | UC07–UC08 | Localization/audio association và POI trigger data phục vụ narration. |
| UC10 | may produce audio task | UC11 | Thay đổi POI có thể dẫn đến background audio processing. |
| UC11 | provides generated audio state/resource | UC07–UC08 | Audio đã xử lý trở thành resource cho playback. |
| UC14 | controls role/permission | UC12–UC16 | RBAC quyết định quyền truy cập/chức năng; không tạo Authorization UC. |
| UC13 | changes Admin account role via | UC14 | UC13 tạo Admin với role mặc định `admin`; đổi role thuộc UC14. |
| UC12–UC14 | important changes may create | UC16 | Các thay đổi quan trọng được ghi Audit Log. |
| Analytics data | supports | UC15 | Dashboard đọc các Analytics read models. |
| `audit_logs` | provides records to | UC16 | AuditLogsPage đọc các audit records. |

**Không tự động dùng `<<include>>` hoặc `<<extend>>` cho các quan hệ trên.** Những quan hệ này thể hiện dependency/precondition/data flow hoặc navigation nghiệp vụ.

---

**Author(s):** `[CẦN BỔ SUNG]`  
**Date:** `2026-10-02`
