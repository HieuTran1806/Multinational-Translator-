# Use Cases — Multitional Translator

## 1. Nguyên tắc và trạng thái xác minh

Danh sách dưới đây được xây dựng từ routes, API clients, controllers, services, security configuration, persistence migrations và test hiện có. Chỉ các luồng có tích hợp thực tế UI/API/backend mới được đưa vào danh sách Use Case chính thức.

Trạng thái IMPLEMENTED nghĩa là có luồng chức năng được nối trong mã nguồn; không đồng nghĩa mọi external credential hoặc production environment đã được kiểm chứng trong lượt audit.

Quy ước:
- User là khách tham quan dùng QR grant; không phải account role trong bảng account.
- ADMIN và SUPER_ADMIN là hai account role duy nhất.
- VISITOR là Spring Security authority phát sinh từ grant hợp lệ.
- Seller, Payment/Order, Seller report và Dynamic RBAC không thuộc phạm vi.
- Offline manifest có API nhưng chưa được Web User tích hợp, nên không có Use Case offline.
- UC IDs được đánh số lại theo thứ tự nghiệp vụ hiện tại.

## 2. Danh sách Use Case chính thức

| Mã | Tên | Actor chính | Phạm vi | Module | Trạng thái xác minh |
|---|---|---|---|---|---|
| UC01 | Chọn và chuyển đổi ngôn ngữ | User | User | language, i18n | IMPLEMENTED |
| UC02 | Kích hoạt quyền truy cập bằng QR | User | User | access, auth | IMPLEMENTED |
| UC03 | Khám phá bản đồ và danh sách POI | User | User | poi, explore | IMPLEMENTED |
| UC04 | Xem chi tiết POI | User | User | poi, media | IMPLEMENTED |
| UC05 | Phát audio thuyết minh POI | User | User | audio, media, analytics | IMPLEMENTED |
| UC06 | Đăng nhập và kết thúc phiên quản trị | Admin, Super Admin | Admin | auth | IMPLEMENTED |
| UC07 | Quản lý POI và bản dịch | Admin | Admin | poi, language | IMPLEMENTED |
| UC08 | Quản lý hình ảnh, audio và tạo TTS | Admin | Admin | poi, media, audio, tts | IMPLEMENTED |
| UC09 | Quản lý QR truy cập | Admin | Admin | access, audit | IMPLEMENTED |
| UC10 | Quản lý tài khoản Admin | Super Admin | Admin | admin, auth, audit | IMPLEMENTED |
| UC11 | Xem Analytics toàn hệ thống | Admin; User phát sinh dữ liệu | User + Admin | analytics, access | IMPLEMENTED |
| UC12 | Tra cứu Audit Log | Super Admin | Admin | audit | IMPLEMENTED |

Tất cả Use Case trong bảng được xác minh là IMPLEMENTED ở mức tích hợp code/UI/API. Riêng việc gọi Google Cloud TTS thật phụ thuộc credentials và chưa được xác minh trong lượt này.

### Đối chiếu mã Use Case lịch sử

Mã trong comment/test cũ có thể còn dùng bộ số UC01–UC15 trước khi chuẩn hóa. Chúng không thay thế mã chính thức trong tài liệu này.

| Mã lịch sử | Chủ đề lịch sử | Xử lý trong danh sách hiện tại |
|---|---|---|
| UC01–UC05 | Ngôn ngữ, QR User, khám phá, chi tiết, audio | Giữ cùng mã UC01–UC05 |
| UC06 | Thuyết minh tự động theo vị trí | Không có triển khai thực tế; loại khỏi Use Case |
| UC07 | Quản lý POI, bản dịch và media | Tách thành UC07 (POI/bản dịch) và UC08 (media/audio/TTS) |
| UC08 | Giám sát tiến độ tạo audio | Gộp vào UC08 |
| UC09 | Quản lý Seller | Đã loại bỏ; không có Use Case |
| UC10 | Quản lý tài khoản Admin | Giữ UC10 |
| UC11 | Phân quyền tĩnh | Chính sách cross-cutting trong Architecture, không phải mục tiêu nghiệp vụ độc lập |
| UC12 | Quản lý QR Admin | Đổi thành UC09 |
| UC13 | Báo cáo Seller | Đã loại bỏ. Các comment UC13/UC14 về raw usage-event tracking là instrumentation và được gộp vào UC11, không phải Seller report |
| UC14 | Analytics toàn hệ thống | Đổi thành UC11 |
| UC15 | Audit Log | Đổi thành UC12 |

Một số comment trong source có thể chứa mã cũ hoặc tham chiếu không còn chính xác; chỉ danh sách UC hiện tại và luồng thực tế được mô tả ở đây là nguồn chuẩn để đọc nghiệp vụ. Không suy ra chức năng từ comment hoặc số UC cũ.

## 3. Actor và ma trận quyền tổng hợp

| Actor / Role | Ý nghĩa | Quyền |
|---|---|---|
| User / VISITOR | Khách tham quan có QR grant hợp lệ | Kích hoạt QR; khám phá POI; xem chi tiết; phát audio; gửi usage events |
| ADMIN | Tài khoản quản trị nội dung | Đăng nhập; quản lý POI/bản dịch/media/audio/TTS/QR; xem Analytics |
| SUPER_ADMIN | Tài khoản quản trị cấp cao | Đăng nhập; quản lý tài khoản ADMIN; đọc Audit Log |
| System / TTS worker | Scheduled backend process | Xử lý TTS jobs và housekeeping session |
| Google Cloud TTS | External provider | Tổng hợp audio khi được cấu hình |

| Chức năng | User/VISITOR | ADMIN | SUPER_ADMIN |
|---|---:|---:|---:|
| Chọn ngôn ngữ / public languages | Có | Có thể gọi public endpoint | Có thể gọi public endpoint |
| Redeem QR | Có | Không thay User | Không thay User |
| Public POI/detail/media | Có grant | Không mặc định | Không mặc định |
| Admin POI/translation/media/audio/QR | Không | Có | Không |
| Analytics | Không đọc dashboard | Có | Không |
| Admin account management | Không | Không | Có |
| Audit Log | Không | Không | Có |

Authorization có thẩm quyền nằm ở SecurityConfig và service. UI route guard chỉ là lớp trải nghiệm.

---

# UC01 — CHỌN VÀ CHUYỂN ĐỔI NGÔN NGỮ

### 1. Mã và tên

- Mã: UC01
- Tên: Chọn và chuyển đổi ngôn ngữ.

### 2. Mục tiêu

Cho phép User chọn một ngôn ngữ đang được backend bật. Lựa chọn điều khiển chuỗi giao diện và ngôn ngữ nội dung POI/audio được yêu cầu.

### 3. Actor

- Actor chính: User — chọn ngôn ngữ.
- Actor phụ: Backend LanguageService — cung cấp danh sách ngôn ngữ.

### 4. Điều kiện tiên quyết

- Web User đã tải được.
- Backend public language endpoint có thể được gọi để tải danh sách; thao tác chọn vẫn giữ ngôn ngữ hiện tại nếu tải danh sách lỗi.
- Không yêu cầu QR grant để xem danh sách/chọn ngôn ngữ trên màn hình welcome.

### 5. Sự kiện kích hoạt

User mở language selector ở header và chọn ngôn ngữ khác.

### 6. Luồng sự kiện chính

1. LanguageProvider gọi GET /api/v1/public/languages.
2. Backend trả danh sách ngôn ngữ đang enabled.
3. LanguageSwitcher hiển thị các lựa chọn.
4. User chọn một language code.
5. LanguageContext cập nhật state và lưu key tm.lang vào localStorage.
6. UI locale thay đổi; danh sách POI và nội dung detail được tải theo language code mới.
7. User tiếp tục thao tác với ngôn ngữ được chọn.

### 7. Luồng thay thế

- A1: Ngôn ngữ đã được lưu trong localStorage được nạp khi mở lại Web User.
- A2: Nếu language đã lưu bị backend disable, ứng dụng chuyển về DEFAULT_LANGUAGE.
- A3: Nếu POI không có bản dịch yêu cầu, backend chọn tiếng Việt trước, sau đó chọn bản dịch có mã ngôn ngữ nhỏ nhất trong danh sách hiện có.

### 8. Luồng ngoại lệ

- E1: GET languages lỗi — giữ ngôn ngữ hiện tại và hiển thị thao tác retry.
- E2: localStorage không khả dụng — lựa chọn vẫn áp dụng trong phiên hiện tại nhưng không bảo đảm được lưu lâu dài.
- E3: Request nội dung theo ngôn ngữ mới lỗi — UI hiển thị lỗi/retry tại chức năng đang mở.

### 9. Quy tắc nghiệp vụ

- Chỉ ngôn ngữ backend trả về ở trạng thái enabled mới được hiển thị như lựa chọn.
- UI locale và nội dung POI dùng chung lựa chọn language code.
- Fallback nội dung thực tế: requested language → vi → language code đầu tiên theo thứ tự.
- Language codes hiện được seed trong V2 là vi và en; không hard-code đây là danh sách không thể thay đổi.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | languageCode | String | Có khi chọn | Mã ngôn ngữ được chọn |
| Output | code | String | Có | Language code |
| Output | name | String | Có | Tên ngôn ngữ |
| Output | nativeName | String | Có | Tên bản địa |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/public/languages | Lấy danh sách ngôn ngữ enabled | Public |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| User | Có | Public endpoint |
| ADMIN | Có | Public endpoint |
| SUPER_ADMIN | Có | Public endpoint |
| VISITOR | Không bắt buộc | Không cần grant |

### 13. Điều kiện hậu

- LanguageContext giữ language code mới trong state.
- Trình duyệt lưu lựa chọn ở localStorage nếu storage khả dụng.
- Request POI tiếp theo sử dụng language code mới.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC01-T01 | Tải danh sách ngôn ngữ | API trả danh sách enabled | Selector hiển thị đúng lựa chọn |
| UC01-T02 | Đổi ngôn ngữ | Chọn code hợp lệ | UI và request nội dung dùng code mới |
| UC01-T03 | Ngôn ngữ đã lưu bị disable | API không còn code cũ | Fallback về DEFAULT_LANGUAGE |
| UC01-T04 | API lỗi | GET languages thất bại | Giữ lựa chọn hiện tại và cho retry |

Test hiện có: LanguageContext.test.jsx, endpoints.test.js. Chưa có bằng chứng riêng cho mọi trường hợp selector UI.

---

# UC02 — KÍCH HOẠT QUYỀN TRUY CẬP BẰNG QR

### 1. Mã và tên

- Mã: UC02
- Tên: Kích hoạt quyền truy cập bằng QR.

### 2. Mục tiêu

Cho phép khách tham quan redeem QR dùng một lần để nhận grant truy cập có thời hạn, ràng buộc với thiết bị hiện tại.

### 3. Actor

- Actor chính: User — quét QR hoặc nhập token/link.
- Actor phụ: Backend AccessGrantService — xác minh QR và tạo grant.
- Actor phụ: System — cung cấp device ID và lưu grant trên thiết bị.

### 4. Điều kiện tiên quyết

- User mở Web User.
- QR đã được Admin phát hành, thuộc access package đang active và chưa redeem/revoke.
- Browser có thể tạo/lưu device ID; token redeem không yêu cầu tài khoản User.

### 5. Sự kiện kích hoạt

User quét QR bằng camera, nhập token thủ công hoặc mở activation link chứa query parameter t.

### 6. Luồng sự kiện chính

1. User mở /welcome.
2. User quét QR bằng camera hoặc nhập QR token/link.
3. Frontend trích xuất token và chuyển sang /activate.
4. Frontend gửi POST /api/v1/public/access/redeem với qrToken và deviceId.
5. Backend hash token, thực hiện thao tác mark redeemed có tính nguyên tử.
6. Backend xác minh QR và access package.
7. Backend tạo access grant chứa hash grant token, hash device ID và expiresAt.
8. Backend trả access token một lần; frontend lưu grant.
9. User được chuyển tới màn hình khám phá POI.
10. Request tiếp theo gửi Authorization Bearer grant và X-Device-Id.

### 7. Luồng thay thế

- A1: Thiết bị đã có grant còn hạn — frontend gọi GET /api/v1/public/access/me để xác minh và khôi phục phiên.
- A2: Redeem thành công từ activation link — frontend xóa query token khỏi URL/history sau khi nhận token.
- A3: Lỗi mạng có thể retry; token QR chưa được redeem thành công sẽ được thử lại.

### 8. Luồng ngoại lệ

- E1: QR không tồn tại hoặc đã revoke — backend từ chối với ACCESS_QR_INVALID.
- E2: QR đã dùng — backend từ chối với ACCESS_QR_ALREADY_USED.
- E3: qrToken/deviceId thiếu hoặc sai định dạng — validation error.
- E4: Grant hết hạn, bị revoke hoặc request từ thiết bị khác — visitor authentication bị từ chối.
- E5: Không kết nối backend khi xác minh grant đã lưu — trạng thái unverified, không cấp quyền dựa trên dữ liệu local chưa xác minh.
- E6: Hai request redeem đồng thời — chỉ một request được đánh dấu redeemed và tạo grant.

### 9. Quy tắc nghiệp vụ

- QR dùng một lần.
- Redeem và tạo grant nằm trong transaction; không tiêu thụ QR nếu grant không được tạo thành công.
- Grant hết hạn theo duration của access package, tính từ thời điểm redeem.
- QR/grant/device ID chỉ lưu dạng SHA-256 hash ở backend.
- Grant gắn với một device ID; thiết bị khác không sử dụng được.
- Revoke QR đã redeem cũng revoke grant tương ứng.
- QR không phải payment/order và không gắn Seller.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | qrToken | String | Có | Tối đa 200 ký tự |
| Input | deviceId | String | Có | 16–128 ký tự, chữ/số/_/- |
| Output | accessToken | String | Có | Grant bearer token, trả một lần |
| Output | tokenType | String | Có | Bearer |
| Output | expiresAt | Instant | Có | Thời điểm hết hạn |
| Output | packageCode | String | Có | Gói access package |
| Output | grantId | Long | Khi kiểm tra phiên | ID grant |
| Output | remainingSeconds | Long | Khi kiểm tra phiên | Thời gian còn lại |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| POST | /api/v1/public/access/redeem | Redeem QR | Public |
| GET | /api/v1/public/access/me | Kiểm tra grant hiện tại | VISITOR grant |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| User | Có | QR hợp lệ và chưa dùng |
| VISITOR | Có | Grant còn hạn, chưa revoke, đúng device |
| ADMIN | Không thay User | Không tự có visitor grant |
| SUPER_ADMIN | Không thay User | Không tự có visitor grant |

### 13. Điều kiện hậu

- QR chuyển trạng thái REDEEMED.
- Một access_grant được tạo.
- Grant token chỉ trả về cho client một lần; database giữ token hash.
- User có thể gọi các public feature được bảo vệ trong thời gian grant còn hiệu lực.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC02-T01 | Redeem QR hợp lệ | QR ISSUED, package active | Tạo grant và trả token |
| UC02-T02 | Redeem lại QR | QR đã REDEEMED | ACCESS_QR_ALREADY_USED |
| UC02-T03 | QR invalid/revoked | Token không tồn tại hoặc revoked | ACCESS_QR_INVALID |
| UC02-T04 | Sai device | Device ID khác với device hash | Không xác thực grant |
| UC02-T05 | Grant hết hạn | expiresAt đã qua | Không truy cập public API |
| UC02-T06 | Concurrent redeem | Hai request cùng QR | Chỉ một grant được tạo |
| UC02-T07 | Khôi phục phiên | Grant còn hạn trên cùng thiết bị | GET /me xác minh và khôi phục |

Test hiện có: AccessGrantServiceTest, AccessFlowIT, AccessPages.test.jsx, AccessContext.test.jsx, qrToken.test.js.

---

# UC03 — KHÁM PHÁ BẢN ĐỒ VÀ DANH SÁCH POI

### 1. Mã và tên

- Mã: UC03
- Tên: Khám phá bản đồ và danh sách POI.

### 2. Mục tiêu

Cho phép User khám phá các POI đã công khai bằng bản đồ tương tác và danh sách có tìm kiếm.

### 3. Actor

- Actor chính: User/VISITOR — xem bản đồ, tìm kiếm và chọn POI.
- Actor phụ: Backend PoiPublicService — trả POI công khai.

### 4. Điều kiện tiên quyết

- User có grant hợp lệ.
- Backend có POI ở trạng thái PUBLISHED và chưa soft delete.
- Kết nối mạng khả dụng để tải danh sách.

### 5. Sự kiện kích hoạt

User truy cập trang khám phá sau khi kích hoạt QR hoặc khôi phục grant hợp lệ.

### 6. Luồng sự kiện chính

1. User mở trang /.
2. RequireAccess kiểm tra trạng thái grant.
3. usePublicPois gọi GET /api/v1/public/pois theo page, size và language.
4. Backend truy vấn POI đã publish, chưa soft delete.
5. Backend trả dữ liệu vị trí, tên theo ngôn ngữ khả dụng, ảnh đại diện và metadata.
6. Frontend hiển thị marker trên Leaflet map và danh sách POI.
7. User tìm kiếm từ khóa; frontend lọc danh sách hiện có phía client.
8. User chọn marker hoặc dòng trong danh sách để mở UC04.

### 7. Luồng thay thế

- A1: Không có POI — hiển thị empty state.
- A2: User nhập từ khóa — lọc dữ liệu đã tải ở client; backend không thực hiện search theo từ khóa cho public endpoint.
- A3: User đổi ngôn ngữ — tải lại danh sách theo language code mới.
- A4: User từ chối quyền vị trí — bản đồ và danh sách vẫn có thể thao tác bằng dữ liệu tọa độ POI; không yêu cầu GPS cho luồng hiện tại.

### 8. Luồng ngoại lệ

- E1: Grant hết hạn/revoked — API trả ACCESS_REQUIRED và frontend kết thúc phiên.
- E2: Network/API lỗi — hiển thị lỗi và cho retry.
- E3: POI không còn published — không xuất hiện trong public list.
- E4: Mất mạng — hiển thị offline banner; không có chế độ offline data.

### 9. Quy tắc nghiệp vụ

- Public query chỉ lấy POI PUBLISHED và chưa soft delete.
- Backend mặc định page 0, size 50; giới hạn phân trang theo PageRequests.
- Frontend gửi size 100 và có thể tải nhiều trang.
- Tìm kiếm hiện tại là lọc phía client, không phải API search server-side.
- Bản đồ sử dụng Leaflet + OpenStreetMap.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | page | Integer | Không | Trang, mặc định 0 |
| Input | size | Integer | Không | Kích thước trang |
| Input | lang | String | Không | Language code, mặc định vi |
| Output | id | Long | Có | POI ID |
| Output | code | String | Có | POI code |
| Output | name | String | Có | Tên theo ngôn ngữ/fallback |
| Output | latitude | Double | Có | Vĩ độ |
| Output | longitude | Double | Có | Kinh độ |
| Output | imageUrl | String | Không | Ảnh đại diện |
| Output | category | String | Không | Danh mục |
| Output | triggerRadius | Double | Có | Bán kính metadata |
| Output | languages | String[] | Có | Ngôn ngữ có bản dịch |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/public/pois?page=&size=&lang= | Danh sách POI | VISITOR grant |
| GET | /api/v1/public/languages | Danh sách ngôn ngữ | Public |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| User/VISITOR | Có | Grant hợp lệ |
| ADMIN | Không qua account role | Cần visitor grant nếu sử dụng User flow |
| SUPER_ADMIN | Không qua account role | Cần visitor grant nếu sử dụng User flow |

### 13. Điều kiện hậu

- Danh sách và marker POI được hiển thị theo dữ liệu backend.
- Tìm kiếm chỉ thay đổi danh sách kết quả client-side.
- Chưa ghi dữ liệu bền vững khi chỉ khám phá bản đồ.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC03-T01 | Load POI | Grant hợp lệ, có POI publish | Map và list hiển thị dữ liệu |
| UC03-T02 | Lọc từ khóa | Có dữ liệu đã tải | Chỉ kết quả khớp hiển thị |
| UC03-T03 | Đổi ngôn ngữ | Language code khác | Tải lại tên theo ngôn ngữ |
| UC03-T04 | POI draft | POI chưa publish | Không có trong public list |
| UC03-T05 | API lỗi | Backend không phản hồi | Hiển thị lỗi/retry |
| UC03-T06 | Grant mất hiệu lực | API trả ACCESS_REQUIRED | Chuyển về luồng kích hoạt |

Test hiện có: ExplorePage.test.jsx, search.test.js, usePublicPois được dùng trong ExplorePage.

---

# UC04 — XEM CHI TIẾT POI

### 1. Mã và tên

- Mã: UC04
- Tên: Xem chi tiết POI.

### 2. Mục tiêu

Hiển thị nội dung giới thiệu, bản dịch, hình ảnh và audio khả dụng của POI đã công khai.

### 3. Actor

- Actor chính: User/VISITOR — mở chi tiết POI.
- Actor phụ: Backend PoiPublicService — truy vấn nội dung và media metadata.

### 4. Điều kiện tiên quyết

- User có grant hợp lệ.
- POI tồn tại, published và chưa soft delete.
- Có bản dịch phù hợp hoặc fallback có thể sử dụng.

### 5. Sự kiện kích hoạt

User chọn POI từ bản đồ hoặc danh sách trong UC03.

### 6. Luồng sự kiện chính

1. Frontend điều hướng tới /pois/:id.
2. PoiDetailPage gọi GET /api/v1/public/pois/{id}?lang={lang}.
3. Backend xác minh POI published.
4. Backend chọn bản dịch theo requested language và fallback rule.
5. Backend trả nội dung, availableLanguages, ảnh và audio hiện hành nếu có.
6. Frontend tải ảnh bằng request có grant.
7. Frontend hiển thị tên, mô tả, narration text, gallery và lựa chọn ngôn ngữ.
8. Frontend ghi nhận sự kiện poi_view qua usage event API.
9. User có thể tiếp tục UC05 nếu audio hiện hành tồn tại.

### 7. Luồng thay thế

- A1: Không có bản dịch theo language được chọn — backend chọn vi, sau đó language code đầu tiên.
- A2: Không có audio hiện hành — vẫn hiển thị transcript.
- A3: User đổi language — frontend gọi lại detail API.
- A4: User quay lại bản đồ — điều hướng về /.

### 8. Luồng ngoại lệ

- E1: POI không tồn tại, draft hoặc soft-deleted — trả 404 và UI cho quay lại map.
- E2: Không có translation nào — trả 404 nội dung.
- E3: Tải ảnh lỗi — UI thể hiện trạng thái tài nguyên lỗi.
- E4: Network lỗi — UI cho retry.
- E5: Grant hết hạn/revoked — chuyển về scan screen.

### 9. Quy tắc nghiệp vụ

- Public detail chỉ trả POI published.
- Fallback language: requested → vi → language code nhỏ nhất.
- Audio trả về phải là asset READY và contentVersion khớp translation hiện tại.
- Ảnh public phải thuộc POI published.
- Offline manifest API không được dùng làm bằng chứng rằng UI hỗ trợ offline; hiện không thấy frontend gọi endpoint đó.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | id | Long | Có | POI ID trên path |
| Input | lang | String | Không | Ngôn ngữ yêu cầu, mặc định vi |
| Output | requestedLanguage | String | Có | Ngôn ngữ yêu cầu |
| Output | language | String | Có | Ngôn ngữ bản dịch được trả |
| Output | fallback | Boolean | Có | Có dùng fallback hay không |
| Output | name | String | Có | Tên POI |
| Output | description | String | Không | Mô tả |
| Output | narrationText | String | Có | Nội dung thuyết minh |
| Output | contentVersion | Integer | Có | Phiên bản nội dung |
| Output | audio | AudioView | Không | Audio hiện hành |
| Output | imageUrl/images | String/String[] | Không | Ảnh đại diện và gallery |
| Output | availableLanguages | String[] | Có | Ngôn ngữ có nội dung |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/public/pois/{id}?lang= | Chi tiết POI | VISITOR grant |
| GET | /api/v1/public/pois/{poiId}/image | Ảnh đại diện | VISITOR grant |
| GET | /api/v1/public/pois/{poiId}/images/{imageId} | Ảnh gallery | VISITOR grant |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| User/VISITOR | Có | Grant hợp lệ và POI published |
| ADMIN | Không qua role Admin | Cần visitor grant cho public API |
| SUPER_ADMIN | Không qua role Super Admin | Cần visitor grant cho public API |

### 13. Điều kiện hậu

- Chi tiết POI được hiển thị theo bản dịch được chọn.
- Event poi_view được gửi để phục vụ Analytics.
- Không thay đổi trạng thái POI hoặc nội dung.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC04-T01 | Xem POI publish | ID hợp lệ, có translation | Trả nội dung chi tiết |
| UC04-T02 | Fallback translation | Không có bản dịch requested | Trả fallback đúng thứ tự |
| UC04-T03 | POI draft | Gọi trực tiếp ID draft | 404 |
| UC04-T04 | Không có audio | Translation không có audio current | Transcript vẫn hiển thị |
| UC04-T05 | Grant invalid | Không có visitor authority | 401 ACCESS_REQUIRED |
| UC04-T06 | Đổi language | Language code khác | Detail được tải lại |

Test hiện có: PoiDetailPage.test.jsx, AccessContext tests, PublicPoi API/POI integration coverage trong PoiFlowIT.

---

# UC05 — PHÁT AUDIO THUYẾT MINH POI

### 1. Mã và tên

- Mã: UC05
- Tên: Phát audio thuyết minh POI.

### 2. Mục tiêu

Cho phép User nghe audio của bản dịch hiện hành với các thao tác phát, tạm dừng, dừng, tua và thử lại.

### 3. Actor

- Actor chính: User/VISITOR — điều khiển audio.
- Actor phụ: Backend PublicAudioQueryService và MediaStorage — xác minh và stream file.
- Actor phụ: Analytics — nhận event audio_play.

### 4. Điều kiện tiên quyết

- User có grant hợp lệ.
- POI đã publish.
- Translation có audio READY khớp contentVersion hiện tại.
- Browser hỗ trợ audio format được trả về.

### 5. Sự kiện kích hoạt

User nhấn Play trên NarrationPlayer ở trang chi tiết POI.

### 6. Luồng sự kiện chính

1. PoiDetailPage lấy audio metadata từ public detail API.
2. useProtectedMedia tải file bằng request có grant và tạo object URL.
3. User nhấn Play.
4. HTMLAudioElement bắt đầu tải/phát audio.
5. Player cập nhật trạng thái loading/playing, thời lượng và vị trí phát.
6. Khi bắt đầu phát lần đầu cho nguồn audio đó, frontend gửi event audio_play.
7. User có thể pause, stop, seek hoặc nghe tiếp.
8. Khi phát hết, player chuyển trạng thái ended.

### 7. Luồng thay thế

- A1: Không có audio — transcript vẫn hiển thị.
- A2: User pause rồi play — tiếp tục từ vị trí hiện tại.
- A3: User stop — audio trở về vị trí 0.
- A4: User seek — cập nhật currentTime.
- A5: Audio tải lỗi — User chọn retry để tạo lần tải mới.

### 8. Luồng ngoại lệ

- E1: Grant hết hạn/revoked — media request bị từ chối.
- E2: Network error — player hiển thị lỗi mạng.
- E3: Unsupported/decode error — hiển thị thông báo audio không hỗ trợ hoặc không giải mã được.
- E4: Browser chặn autoplay — UI báo cần thao tác phát trực tiếp.
- E5: Audio asset không còn current hoặc POI không published — backend trả 404.
- E6: Mất mạng khi đang phát — player dừng và chuyển trạng thái lỗi.

### 9. Quy tắc nghiệp vụ

- Public audio chỉ được stream khi POI published và asset hiện hành.
- Asset phải READY và contentVersion khớp translation.
- User request phải mang visitor grant.
- Usage event audio_play được ghi nhận khi audio phát lần đầu cho nguồn đó; không phải mỗi lần pause/resume.
- Không có offline audio playback flow được tích hợp trong Web User.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | assetId | Long | Có | Audio asset ID |
| Input | Authorization | Bearer token | Có | Visitor grant |
| Input | X-Device-Id | String | Có | Thiết bị đã redeem |
| Output | audio bytes | Binary stream | Có | Audio file |
| Output | Content-Type | String | Có | MIME type |
| Output | eventType | String | Khi tracking | audio_play |
| Output | poiId | Long | Không | POI ID khi tracking |
| Output | eventId | String | Không | Dedup key nếu client gửi |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/public/audio/{assetId} | Stream audio hiện hành | VISITOR grant |
| POST | /api/v1/public/usage-events | Ghi audio_play | VISITOR grant |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| User/VISITOR | Có | Grant hợp lệ; audio current |
| ADMIN | Không qua role Admin | Cần visitor grant cho public audio |
| SUPER_ADMIN | Không qua role Super Admin | Cần visitor grant cho public audio |

### 13. Điều kiện hậu

- Player chuyển sang trạng thái ended, paused hoặc idle theo thao tác.
- Usage event audio_play được gửi khi bắt đầu phát.
- Không thay đổi audio asset hoặc POI data.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC05-T01 | Phát audio current | Asset READY/current | Audio phát |
| UC05-T02 | Pause/resume | Đang phát | Tiếp tục đúng vị trí |
| UC05-T03 | Stop | Đang phát | Trở về 0 |
| UC05-T04 | Retry | Network/media error | Tạo lần tải mới |
| UC05-T05 | Audio stale | Version không khớp | Backend không stream asset cũ |
| UC05-T06 | Không có audio | Audio null | Transcript vẫn hiển thị |
| UC05-T07 | Ghi usage event | Audio bắt đầu phát | Gửi audio_play |

Test hiện có: NarrationPlayer.test.jsx, useNarrationPlayer.test.js và PublicAudio/POI integration coverage trong backend tests.

---

# UC06 — ĐĂNG NHẬP VÀ KẾT THÚC PHIÊN QUẢN TRỊ

### 1. Mã và tên

- Mã: UC06
- Tên: Đăng nhập và kết thúc phiên quản trị.

### 2. Mục tiêu

Xác thực tài khoản ADMIN hoặc SUPER_ADMIN và quản lý phiên bearer token có thời hạn, có thể thu hồi.

### 3. Actor

- Actor chính: ADMIN hoặc SUPER_ADMIN.
- Actor phụ: AuthService — xác thực credentials và tạo session.
- Actor phụ: System — dọn session hết hạn/đã revoke.

### 4. Điều kiện tiên quyết

- Account tồn tại, chưa soft-delete và enabled=true.
- Backend kết nối được database.
- Người dùng có username/password hợp lệ.

### 5. Sự kiện kích hoạt

Admin mở /login và gửi form đăng nhập hoặc chọn logout.

### 6. Luồng sự kiện chính

1. User nhập username/password.
2. Frontend gửi POST /api/v1/auth/login.
3. Backend tìm live account theo username.
4. Backend kiểm tra BCrypt password hash và trạng thái enabled.
5. Backend tạo opaque token ngẫu nhiên và lưu SHA-256(token) vào auth_session.
6. Backend trả accessToken, expiresAt và account information.
7. Frontend lưu session ở sessionStorage.
8. Các request tiếp theo gửi Authorization Bearer token.
9. Khi logout, frontend gọi POST /api/v1/auth/logout.
10. Backend đặt revoked_at; frontend xóa session local.
11. GET /api/v1/auth/me trả account hiện tại khi session còn hợp lệ.

### 7. Luồng thay thế

- A1: Reload trang — AuthContext đọc sessionStorage và tiếp tục phiên nếu token còn hợp lệ.
- A2: Session hết hạn — frontend tự xóa session theo expiresAt.
- A3: User không logout nhưng token bị revoke/disabled — request tiếp theo nhận 401 và frontend xóa session.

### 8. Luồng ngoại lệ

- E1: Sai username/password — INVALID_CREDENTIALS.
- E2: Account disabled hoặc soft-deleted — login bị từ chối.
- E3: Token hết hạn, unknown hoặc revoked — 401.
- E4: Không kết nối backend — thông báo lỗi mạng.
- E5: Request không đủ role — 403.

### 9. Quy tắc nghiệp vụ

- Password hash dùng BCrypt.
- Token có 32 byte entropy từ SecureRandom và chỉ trả một lần.
- Database chỉ lưu SHA-256 token hash.
- Session TTL mặc định 8 giờ, cấu hình qua APP_AUTH_SESSION_TTL.
- Logout revoke token server-side.
- Session cleanup chạy mỗi giờ, xóa session expired/revoked cũ hơn một ngày.
- User visitor grant không phải Admin account session.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | username | String | Có | Tối đa 64 ký tự |
| Input | password | String | Có | Tối đa 200 ký tự |
| Output | accessToken | String | Có | Opaque bearer token |
| Output | tokenType | String | Có | Bearer |
| Output | expiresAt | Instant | Có | Hạn session |
| Output | account.id | Long | Có | Account ID |
| Output | account.username | String | Có | Username |
| Output | account.displayName | String | Không | Tên hiển thị |
| Output | account.role | Enum | Có | ADMIN hoặc SUPER_ADMIN |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| POST | /api/v1/auth/login | Đăng nhập | Public |
| POST | /api/v1/auth/logout | Thu hồi session hiện tại | ADMIN/SUPER_ADMIN |
| GET | /api/v1/auth/me | Thông tin account hiện tại | ADMIN/SUPER_ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| ADMIN | Có | Account active |
| SUPER_ADMIN | Có | Account active |
| VISITOR | Không | Visitor grant không phải account session |

### 13. Điều kiện hậu

- Login thành công: có auth_session active và frontend lưu token.
- Logout thành công: auth_session bị revoke và frontend xóa token.
- Account disabled/deleted không tiếp tục sử dụng session.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC06-T01 | Login hợp lệ | Account active, password đúng | Trả bearer token |
| UC06-T02 | Login sai | Password sai | 401 |
| UC06-T03 | Account disabled | enabled=false | Không tạo session |
| UC06-T04 | Logout | Token active | Token bị revoke |
| UC06-T05 | Token hết hạn | expiresAt đã qua | 401 |
| UC06-T06 | Session khôi phục | Token trong sessionStorage còn hiệu lực | AuthContext tiếp tục phiên |

Test hiện có: AuthContext.test.jsx, LoginPage.test.jsx, SecurityIT và BootstrapAdminRunnerTest.

---

# UC07 — QUẢN LÝ POI VÀ BẢN DỊCH

### 1. Mã và tên

- Mã: UC07
- Tên: Quản lý POI và bản dịch.

### 2. Mục tiêu

Cho phép Admin tạo, tìm kiếm, xem, cập nhật, publish/unpublish và soft-delete POI; quản lý nội dung theo ngôn ngữ.

### 3. Actor

- Actor chính: ADMIN — quản lý dữ liệu POI.
- Actor phụ: Backend PoiAdminService/PoiAdminQueryService — kiểm tra và lưu nghiệp vụ.

### 4. Điều kiện tiên quyết

- Admin đã đăng nhập và session hợp lệ.
- Role là ADMIN.
- Ngôn ngữ đích đang enabled khi lưu translation.

### 5. Sự kiện kích hoạt

Admin mở danh sách POI, tạo POI mới hoặc chọn một POI để chỉnh sửa.

### 6. Luồng sự kiện chính

1. Admin mở /pois.
2. Frontend gọi GET /api/v1/admin/pois với page, size, status và q tùy chọn.
3. Admin chọn tạo mới hoặc mở POI hiện có.
4. Khi tạo, Admin nhập code, defaultName, latitude, longitude, category và triggerRadius.
5. Frontend gửi POST /api/v1/admin/pois.
6. Backend validate, kiểm tra code unique và tạo POI trạng thái DRAFT.
7. Khi sửa, frontend gửi PUT /api/v1/admin/pois/{id} kèm rowVersion nếu có.
8. Backend kiểm tra POI active, code uniqueness và optimistic-lock version.
9. Admin chọn language và nhập name, description, narrationText.
10. Frontend gửi PUT /api/v1/admin/pois/{id}/translations/{lang}.
11. Backend kiểm tra language enabled, lưu translation và tăng contentVersion nếu narration thay đổi.
12. Admin có thể publish, unpublish hoặc soft-delete POI.

### 7. Luồng thay thế

- A1: Admin lọc theo status hoặc keyword q.
- A2: Admin chỉ sửa metadata POI mà không đổi narration — audio không bị invalidated.
- A3: Admin chuyển POI đã publish về DRAFT.
- A4: Admin soft-delete POI — record và dữ liệu liên quan được giữ lại; public query không trả POI đó.

### 8. Luồng ngoại lệ

- E1: Code trùng — 409 CONFLICT.
- E2: rowVersion không khớp — 409, yêu cầu tải lại.
- E3: Field thiếu/sai định dạng — 400 validation.
- E4: POI không tồn tại hoặc đã soft-delete — 404.
- E5: Language không enabled — request bị từ chối.
- E6: Publish khi thiếu English translation hoặc audio hiện hành — PUBLISH_NOT_READY.
- E7: ADMIN không đủ quyền do session/role — 401/403.

### 9. Quy tắc nghiệp vụ

- POI code: chữ hoa, số, - hoặc _, độ dài 2–50.
- defaultName bắt buộc, tối đa 200 ký tự.
- latitude -90..90; longitude -180..180.
- category tối đa 100 ký tự.
- triggerRadius 1..5000 mét; mặc định 50 khi tạo nếu không gửi.
- POI mới ở DRAFT.
- Publish cần translation tiếng Anh và audio tiếng Anh READY/current.
- Soft delete dùng deleted_at, không hard delete record.
- Narration text tối đa 20000 ký tự; description tối đa 5000 ký tự.
- Update hỗ trợ rowVersion để phát hiện concurrent edit.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | page | Integer | Không | Trang danh sách, mặc định 0 |
| Input | size | Integer | Không | Page size, mặc định 20, tối đa 100 |
| Input | status | Enum | Không | Lọc DRAFT/PUBLISHED |
| Input | q | String | Không | Từ khóa lọc danh sách |
| Input | code | String | Có | Mã POI 2–50 ký tự |
| Input | defaultName | String | Có | Tên mặc định |
| Input | latitude | Double | Có | -90..90 |
| Input | longitude | Double | Có | -180..180 |
| Input | category | String | Không | Tối đa 100 ký tự |
| Input | triggerRadius | Double | Không | 1..5000 |
| Input | rowVersion | Long | Không | Optimistic lock |
| Input | name | String | Có khi lưu translation | Tên bản dịch |
| Input | description | String | Không | Tối đa 5000 |
| Input | narrationText | String | Có khi lưu translation | Tối đa 20000 |
| Output | id | Long | Có | POI ID |
| Output | status | Enum | Có | DRAFT/PUBLISHED |
| Output | rowVersion | Long | Có | Phiên bản cập nhật |
| Output | translations | Array | Có | Nội dung theo ngôn ngữ |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/admin/pois | Danh sách/lọc POI | ADMIN |
| POST | /api/v1/admin/pois | Tạo POI | ADMIN |
| GET | /api/v1/admin/pois/{id} | Chi tiết POI | ADMIN |
| PUT | /api/v1/admin/pois/{id} | Cập nhật POI | ADMIN |
| DELETE | /api/v1/admin/pois/{id} | Soft-delete POI | ADMIN |
| POST | /api/v1/admin/pois/{id}/publish | Publish | ADMIN |
| POST | /api/v1/admin/pois/{id}/unpublish | Unpublish | ADMIN |
| PUT | /api/v1/admin/pois/{id}/translations/{lang} | Lưu translation | ADMIN |
| GET | /api/v1/admin/languages | Danh sách language cho editor | ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| ADMIN | Có | Session hợp lệ |
| SUPER_ADMIN | Không | Backend trả 403 |
| VISITOR | Không | Không có admin authority |

### 13. Điều kiện hậu

- POI metadata/translation được lưu.
- Trạng thái POI thay đổi theo publish/unpublish.
- Delete đặt deleted_at, giữ dữ liệu liên quan.
- Khi narration thay đổi, audio cũ bị chuyển STALE.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC07-T01 | Tạo POI | Payload hợp lệ | Tạo POI DRAFT |
| UC07-T02 | Code duplicate | Code đã tồn tại | 409 |
| UC07-T03 | Cập nhật POI | rowVersion đúng | Lưu thay đổi |
| UC07-T04 | Optimistic lock | rowVersion cũ | 409 |
| UC07-T05 | Lưu translation | Language enabled | Lưu nội dung |
| UC07-T06 | Narration đổi | Text khác trước | contentVersion tăng, audio STALE |
| UC07-T07 | Publish chưa sẵn sàng | Thiếu English audio current | PUBLISH_NOT_READY |
| UC07-T08 | Soft delete | POI active | Ẩn khỏi public list/detail |

Test hiện có: PoiAdminServiceTest, PoiLifecycleTest, PoiTranslationTest, PoiFlowIT, PoiListPage.test.jsx, PoiEditPage tests và mock API tests.

---

# UC08 — QUẢN LÝ HÌNH ẢNH, AUDIO VÀ TẠO TTS

### 1. Mã và tên

- Mã: UC08
- Tên: Quản lý hình ảnh, audio và tạo TTS.

### 2. Mục tiêu

Cho phép Admin tải ảnh POI, quản lý thứ tự ảnh, upload audio cho translation hoặc yêu cầu backend tạo audio bằng Google Cloud TTS.

### 3. Actor

- Actor chính: ADMIN — upload, sắp xếp và preview media.
- Actor phụ: TTS worker — xử lý job bất đồng bộ.
- Actor phụ: Google Cloud TTS — provider tổng hợp giọng nói khi được cấu hình.
- Actor phụ: MediaStorage — lưu bytes.

### 4. Điều kiện tiên quyết

- Admin đã đăng nhập.
- POI active.
- Translation đã được lưu trước khi gắn audio.
- Media storage hoạt động.
- Để tạo TTS, backend phải có provider và credentials hợp lệ.

### 5. Sự kiện kích hoạt

Admin mở POI editor, chọn tải ảnh/audio hoặc chọn Tạo bằng Google TTS.

### 6. Luồng sự kiện chính

1. Admin mở POI editor.
2. Frontend tải dữ liệu POI, languages và TTS status.
3. Admin upload ảnh JPEG/PNG/WEBP hoặc upload audio MP3/M4A/WAV/OGG.
4. Backend kiểm tra size và phát hiện media type từ file bytes.
5. Backend lưu file qua MediaStorage và metadata vào poi_image/audio_asset.
6. Với TTS, Admin yêu cầu POST TTS endpoint.
7. Backend tạo hoặc tái sử dụng job theo content hash/version.
8. Worker lấy job QUEUED và gọi TtsProvider ngoài transaction database.
9. Worker lưu audio asset khi kết quả thành công và content version vẫn hợp lệ.
10. Frontend polling job status.
11. Khi job SUCCEEDED, Admin preview audio.
12. Khi job FAILED, frontend hiển thị error message/code.

### 7. Luồng thay thế

- A1: Upload ảnh đầu tiên — ảnh được dùng làm cover image.
- A2: Admin xóa ảnh — backend cập nhật thứ tự ảnh còn lại và chọn cover mới nếu cần.
- A3: Admin đổi thứ tự ảnh — danh sách ID phải chứa đủ ảnh hiện tại, không trùng.
- A4: Audio TTS cùng content hash đã có — backend trả reusedExisting và không tạo job mới.
- A5: TTS chưa cấu hình — Admin vẫn có thể upload audio thủ công.
- A6: Nội dung narration đang dirty/chưa lưu — UI khóa thao tác upload/TTS cho tới khi lưu.

### 8. Luồng ngoại lệ

- E1: File rỗng hoặc vượt giới hạn — 400/413.
- E2: Media type không được hỗ trợ — 415.
- E3: POI/translation không tồn tại — 404.
- E4: Vượt 6 ảnh/POI — 409.
- E5: Thứ tự ảnh thiếu ID, thừa ID hoặc trùng ID — 400.
- E6: TTS chưa cấu hình — 503 TTS_NOT_CONFIGURED.
- E7: Provider lỗi/timeout — job FAILED hoặc retry theo loại lỗi.
- E8: Nội dung đổi khi job đang chạy — kết quả version cũ không được gắn thành audio hiện hành.

### 9. Quy tắc nghiệp vụ

- Mỗi POI tối đa 6 ảnh.
- Ảnh tối đa 5 MiB; chỉ JPEG, PNG, WEBP được chấp nhận.
- Audio upload tối đa 20 MiB; chấp nhận MP3, M4A, WAV, OGG.
- File type được phát hiện từ bytes, không tin filename/MIME do client gửi.
- TTS text mặc định tối đa 4500 byte UTF-8.
- Timeout mặc định 30 giây; tối đa 3 attempts.
- Worker chạy mỗi 2 giây, xử lý tối đa 5 job/tick; stale running recovery mỗi 5 phút.
- Audio asset gắn với contentVersion.
- Google TTS không dịch nội dung; Admin phải nhập bản dịch riêng.
- Mã tích hợp Google tồn tại nhưng lượt audit chưa xác minh gọi Google thật.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | poiId | Long | Có | POI ID |
| Input | lang | String | Có | Language code |
| Input | file | Multipart file | Tùy thao tác | Image/audio file |
| Input | imageIds | Long[] | Khi reorder | Danh sách ID đầy đủ, không trùng |
| Output | image.id | Long | Có | Image ID |
| Output | image.url | String | Có | API path |
| Output | image.sortOrder | Integer | Có | Thứ tự ảnh |
| Output | audio.id | Long | Có | Asset ID |
| Output | audio.source | Enum | Có | UPLOAD/TTS |
| Output | audio.status | Enum | Có | READY/STALE |
| Output | job.status | Enum | Khi TTS | QUEUED/RUNNING/SUCCEEDED/FAILED |
| Output | job.attempts | Integer | Khi TTS | Số lần thử |
| Output | job.errorCode/errorMessage | String | Khi lỗi | Thông tin lỗi |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| POST | /api/v1/admin/pois/{id}/image | Upload ảnh | ADMIN |
| DELETE | /api/v1/admin/pois/{id}/images/{imageId} | Xóa ảnh | ADMIN |
| PUT | /api/v1/admin/pois/{id}/images/order | Sắp xếp ảnh | ADMIN |
| POST | /api/v1/admin/pois/{id}/translations/{lang}/audio | Upload audio | ADMIN |
| GET | /api/v1/admin/audio/{assetId} | Preview audio | ADMIN |
| GET | /api/v1/admin/pois/{poiId}/image | Xem cover image | ADMIN |
| GET | /api/v1/admin/pois/{poiId}/images/{imageId} | Xem ảnh gallery | ADMIN |
| GET | /api/v1/admin/tts/status | Kiểm tra provider | ADMIN |
| POST | /api/v1/admin/pois/{poiId}/translations/{lang}/tts | Tạo/reuse TTS job | ADMIN |
| GET | /api/v1/admin/tts/jobs/{jobId} | Poll job status | ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| ADMIN | Có | Session hợp lệ |
| SUPER_ADMIN | Không | Backend trả 403 |
| VISITOR | Không upload/preview Admin | Chỉ có public media theo grant |

### 13. Điều kiện hậu

- Media bytes được lưu qua MediaStorage.
- Metadata được ghi trong database.
- Cover image và sort order phản ánh thứ tự hiện tại.
- TTS job kết thúc ở SUCCEEDED hoặc FAILED; audio hiện hành chỉ được cập nhật khi đúng contentVersion.
- Không có bảo đảm gọi Google thật nếu provider chưa được cấu hình.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC08-T01 | Upload ảnh hợp lệ | JPEG/PNG/WEBP dưới 5 MiB | Ảnh được lưu |
| UC08-T02 | Vượt số ảnh | Đã có 6 ảnh | 409 |
| UC08-T03 | File giả MIME | Bytes không phải image hợp lệ | 415 |
| UC08-T04 | Reorder | Danh sách ID chính xác | Cập nhật sort order/cover |
| UC08-T05 | Upload audio | Format được hỗ trợ, dưới 20 MiB | Audio READY |
| UC08-T06 | TTS chưa cấu hình | Provider none | UI disable TTS/API trả 503 |
| UC08-T07 | TTS job success/failure | Worker/provider test | Job cập nhật trạng thái đúng |
| UC08-T08 | Narration version thay đổi | Job/audio version cũ | Không dùng audio version cũ |

Test hiện có: PoiMediaServiceTest, media tests, R2MediaStorageTest, ContentHashTest, TtsIT, TtsNotConfiguredIT, AudioPanel tests qua component usage và mock API tests.

---

# UC09 — QUẢN LÝ QR TRUY CẬP

### 1. Mã và tên

- Mã: UC09
- Tên: Quản lý QR truy cập.

### 2. Mục tiêu

Cho phép Admin phát hành QR dùng một lần, xem danh sách/trạng thái và thu hồi QR.

### 3. Actor

- Actor chính: ADMIN — phát hành, tra cứu và revoke QR.
- Actor phụ: User — redeem QR trong UC02.
- Actor phụ: Backend AccessQrAdminService — quản lý QR/grant và audit.

### 4. Điều kiện tiên quyết

- Admin đã đăng nhập.
- Access package được cấu hình và active.
- Admin có quyền ADMIN.

### 5. Sự kiện kích hoạt

Admin mở /access-qrs và chọn tạo QR, lọc danh sách hoặc revoke một QR.

### 6. Luồng sự kiện chính

1. Admin mở trang QR.
2. Frontend gọi GET /api/v1/admin/access-qrs.
3. Backend trả danh sách QR mới nhất trước, có thể lọc status và phân trang.
4. Admin nhập note tùy chọn và tạo QR.
5. Frontend gửi POST /api/v1/admin/access-qrs.
6. Backend chọn packageCode được gửi hoặc APP_ACCESS_DEFAULT_PACKAGE.
7. Backend tạo token ngẫu nhiên, chỉ lưu SHA-256 hash.
8. Backend trả qrToken và activationUrl một lần.
9. Admin lưu/hiển thị QR cho khách tham quan.
10. Admin có thể revoke QR từ danh sách.
11. Backend chuyển status REVOKED và revoke grant liên quan nếu QR đã redeem.
12. Backend ghi audit event QR_ISSUE/QR_REVOKE.

### 7. Luồng thay thế

- A1: Admin không gửi packageCode — dùng gói mặc định cấu hình, mặc định DEMO_24H.
- A2: Admin lọc status ISSUED/REDEEMED/REVOKED.
- A3: QR đã revoke — thao tác revoke lặp lại không thay đổi trạng thái.

### 8. Luồng ngoại lệ

- E1: Package không tồn tại hoặc inactive — BAD_REQUEST.
- E2: QR ID không tồn tại — 404.
- E3: Admin session không hợp lệ — 401.
- E4: SUPER_ADMIN gọi endpoint QR — 403.
- E5: Database/audit write lỗi — thao tác transaction bị hủy theo service boundary.

### 9. Quy tắc nghiệp vụ

- QR token chỉ trả về đúng lần issue; list API không trả plaintext token.
- QR dùng một lần và không có seller ownership.
- QR đã phát hành không có expires_at; thời hạn của access grant chỉ bắt đầu tính từ lúc redeem thành công.
- Note tối đa 200 ký tự.
- packageCode tối đa 40 ký tự; UI hiện gửi note và sử dụng package mặc định.
- Revoke QR đã redeem sẽ revoke grant.
- Revoke là idempotent.
- Không có thanh toán/order hoặc xác minh payment trong luồng này.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | packageCode | String | Không | Mã access package |
| Input | note | String | Không | Tối đa 200 ký tự |
| Input | status | Enum | Không | ISSUED/REDEEMED/REVOKED |
| Input | page | Integer | Không | Trang |
| Input | size | Integer | Không | Kích thước trang |
| Output | id | Long | Có | QR ID |
| Output | status | Enum | Có | Trạng thái QR |
| Output | packageCode | String | Có | Gói |
| Output | durationMinutes | Integer | Có | Thời hạn grant |
| Output | qrToken | String | Chỉ khi issue | Token plaintext trả một lần |
| Output | activationUrl | String | Chỉ khi issue | Link kích hoạt |
| Output | createdAt/redeemedAt/revokedAt | Instant | Có thể null | Mốc thời gian |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| POST | /api/v1/admin/access-qrs | Phát hành QR | ADMIN |
| GET | /api/v1/admin/access-qrs | Danh sách QR | ADMIN |
| POST | /api/v1/admin/access-qrs/{id}/revoke | Thu hồi QR | ADMIN |
| POST | /api/v1/public/access/redeem | User redeem QR | Public |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| ADMIN | Có | Session hợp lệ |
| SUPER_ADMIN | Không | Backend trả 403 |
| User/VISITOR | Không quản trị QR | Chỉ redeem QR ở UC02 |

### 13. Điều kiện hậu

- QR mới được tạo với status ISSUED và token hash được lưu.
- QR bị revoke có status REVOKED.
- Grant liên quan bị revoke nếu đã tồn tại.
- Audit event được ghi cho issue/revoke.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC09-T01 | Issue QR | Package active | Trả token và activation URL |
| UC09-T02 | Issue default package | Không gửi packageCode | Dùng package cấu hình |
| UC09-T03 | List QR | Có nhiều trạng thái | Trả trang và status đúng |
| UC09-T04 | Revoke QR chưa redeem | QR ISSUED | QR REVOKED |
| UC09-T05 | Revoke QR đã redeem | Có grant liên quan | QR và grant bị revoke |
| UC09-T06 | Revoke lặp | QR đã REVOKED | Trạng thái không đổi |
| UC09-T07 | SUPER_ADMIN gọi QR API | Token Super Admin | 403 |

Test hiện có: AccessFlowIT, AccessQrPage.test.jsx, AccessGrantServiceTest và AccessQrAdminService được kiểm thử gián tiếp qua integration flow.

---

# UC10 — QUẢN LÝ TÀI KHOẢN ADMIN

### 1. Mã và tên

- Mã: UC10
- Tên: Quản lý tài khoản Admin.

### 2. Mục tiêu

Cho phép Super Admin tạo, tra cứu, cập nhật trạng thái/tên hiển thị, reset mật khẩu và soft-delete tài khoản ADMIN.

### 3. Actor

- Actor chính: SUPER_ADMIN.
- Actor phụ: Backend AdminAccountService — kiểm tra role, lifecycle và ghi audit.
- Actor bị quản lý: ADMIN.

### 4. Điều kiện tiên quyết

- Super Admin đã đăng nhập.
- Session còn hiệu lực.
- Target account là role ADMIN và chưa soft-delete đối với thao tác get/update/reset/delete.

### 5. Sự kiện kích hoạt

Super Admin mở /accounts và chọn một thao tác quản lý tài khoản.

### 6. Luồng sự kiện chính

1. Super Admin mở danh sách tài khoản Admin.
2. Frontend gọi GET /api/v1/admin/accounts.
3. Super Admin tìm kiếm hoặc mở chi tiết một Admin.
4. Khi tạo, Super Admin nhập username, password và displayName.
5. Frontend gửi POST /api/v1/admin/accounts.
6. Backend xác minh username chưa tồn tại trong live accounts, hash password và cố định role ADMIN.
7. Khi update, backend chỉ cập nhật displayName và enabled.
8. Khi reset password, backend hash mật khẩu mới.
9. Khi delete, backend soft-delete account và ghi deleted_at/deleted_by.
10. Các thao tác quản trị được ghi Audit Log.
11. Frontend tải lại danh sách.

### 7. Luồng thay thế

- A1: Super Admin lọc danh sách bằng q và pagination.
- A2: Super Admin khóa account bằng enabled=false.
- A3: Super Admin mở khóa account bằng enabled=true.
- A4: Super Admin reset password nhưng giữ nguyên username/role.
- A5: Super Admin xóa mềm account; lịch sử được giữ lại.

### 8. Luồng ngoại lệ

- E1: Username trùng live account — 409.
- E2: Username/password sai validation — 400.
- E3: Target không tồn tại hoặc không phải ADMIN — 404.
- E4: Super Admin tự xóa chính mình — 403.
- E5: ADMIN gọi Accounts API — 403.
- E6: Account disabled hoặc soft-deleted — login/session bị từ chối.

### 9. Quy tắc nghiệp vụ

- Chỉ SUPER_ADMIN được gọi Accounts API.
- Chỉ quản lý target role ADMIN.
- Role khi tạo luôn cố định ADMIN; không có role editor.
- Không tạo/sửa/xóa SUPER_ADMIN bằng UC này.
- Username 3–64 ký tự, chỉ chữ/số/._-.
- Password create/reset dài 6–200 ký tự; backend BCrypt hash.
- Display name tối đa 120 ký tự.
- Không cho tự soft-delete.
- Soft delete giữ lịch sử, chặn đăng nhập và loại khỏi live lookup.
- UC không phải Dynamic RBAC.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | username | String | Có khi create | 3–64 ký tự |
| Input | password | String | Có khi create | 6–200 ký tự |
| Input | displayName | String | Không | Tối đa 120 ký tự |
| Input | enabled | Boolean | Không | Trạng thái account |
| Input | newPassword | String | Có khi reset | 6–200 ký tự |
| Input | q | String | Không | Từ khóa tìm kiếm |
| Output | id | Long | Có | Account ID |
| Output | username | String | Có | Username |
| Output | displayName | String | Không | Tên hiển thị |
| Output | role | Enum | Có | Luôn ADMIN trong module |
| Output | enabled | Boolean | Có | Trạng thái |
| Output | createdAt | Instant | Có | Thời điểm tạo |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/admin/accounts | Danh sách | SUPER_ADMIN |
| GET | /api/v1/admin/accounts/{id} | Chi tiết | SUPER_ADMIN |
| POST | /api/v1/admin/accounts | Tạo Admin | SUPER_ADMIN |
| PUT | /api/v1/admin/accounts/{id} | Update displayName/enabled | SUPER_ADMIN |
| POST | /api/v1/admin/accounts/{id}/reset-password | Reset mật khẩu | SUPER_ADMIN |
| DELETE | /api/v1/admin/accounts/{id} | Soft-delete | SUPER_ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| SUPER_ADMIN | Có | Session hợp lệ |
| ADMIN | Không | 403 |
| VISITOR | Không | Không có account authority |

### 13. Điều kiện hậu

- Account mới có role ADMIN và password hash.
- Account update có displayName/enabled mới.
- Reset password cập nhật password_hash.
- Delete đặt deleted_at/deleted_by, giữ lịch sử và chặn đăng nhập.
- Audit Log có sự kiện tương ứng khi thao tác thành công.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC10-T01 | Create Admin | Payload hợp lệ | Tạo account role ADMIN |
| UC10-T02 | Duplicate username | Live username đã tồn tại | 409 |
| UC10-T03 | Update enabled | enabled=false/true | Account đổi trạng thái |
| UC10-T04 | Reset password | Password hợp lệ | Hash mới được lưu |
| UC10-T05 | Soft delete | Target ADMIN khác actor | Account bị soft-delete |
| UC10-T06 | Self delete | Target ID bằng actor ID | 403 |
| UC10-T07 | ADMIN gọi API | Role ADMIN | 403 |
| UC10-T08 | Tạo Super Admin qua UC10 | Payload không có role editor | Không có chức năng này |

Test hiện có: AdminAccountServiceTest, AdminAccountFlowIT, AdminAccountsPage.test.jsx, BootstrapAdminRunnerTest.

---

# UC11 — XEM ANALYTICS TOÀN HỆ THỐNG

### 1. Mã và tên

- Mã: UC11
- Tên: Xem Analytics toàn hệ thống.

### 2. Mục tiêu

Cho phép Admin xem tổng số sự kiện sử dụng, chuỗi số liệu theo ngày và top POI theo lượt xem. User app gửi sự kiện để backend tổng hợp.

### 3. Actor

- Actor chính: ADMIN — xem dashboard.
- Actor phụ: User/VISITOR — phát sinh session_start, poi_view, audio_play.
- Actor phụ: Backend UsageEventService/AnalyticsService — ghi và tổng hợp sự kiện.

### 4. Điều kiện tiên quyết

- Admin đã đăng nhập để xem dashboard.
- User phải có visitor grant hợp lệ để gửi usage event.
- Backend và database hoạt động.

### 5. Sự kiện kích hoạt

Admin mở /analytics hoặc User thực hiện hành vi được tracking trong Web User.

### 6. Luồng sự kiện chính

1. Khi User redeem QR thành công, frontend gửi session_start.
2. Khi User mở chi tiết POI, frontend gửi poi_view.
3. Khi audio bắt đầu phát, frontend gửi audio_play.
4. Backend xác minh VISITOR grant; grantId lấy từ authenticated principal, không nhận từ body.
5. Backend validate eventType và eventId; eventId có thể dùng để deduplicate.
6. UsageEventService lưu raw event.
7. Admin mở /analytics.
8. Frontend gọi GET /api/v1/admin/analytics/summary với from/to nếu được chọn.
9. Backend validate khoảng thời gian và tổng hợp trong database.
10. Backend trả totals, daily counts, top 10 POIs và generatedAt.
11. Frontend hiển thị dashboard.

### 7. Luồng thay thế

- A1: Không gửi from/to — backend mặc định 30 ngày gần nhất tới thời điểm hiện tại.
- A2: Chỉ gửi from — to mặc định hiện tại.
- A3: Chỉ gửi to — from mặc định 30 ngày trước to.
- A4: eventId đã tồn tại — request retry trở thành no-op.
- A5: Không có dữ liệu — dashboard hiển thị empty state.

### 8. Luồng ngoại lệ

- E1: eventType ngoài poi_view/audio_play/session_start — validation error.
- E2: eventId dài hơn 64 hoặc sai pattern — validation error.
- E3: User không có grant — 401 ACCESS_REQUIRED.
- E4: from không trước to — 400 BAD_REQUEST.
- E5: SUPER_ADMIN gọi Analytics — 403.
- E6: Backend/database lỗi — dashboard hiển thị lỗi.

### 9. Quy tắc nghiệp vụ

- Chỉ ADMIN đọc Analytics.
- VISITOR grant gửi usage event.
- grantId lấy từ server-side authenticated principal.
- Event types hợp lệ: poi_view, audio_play, session_start.
- eventId là tùy chọn; nếu có thì unique và retry idempotent.
- Analytics tổng hợp theo UTC; UI hiển thị ngày/giờ theo Asia/Ho_Chi_Minh.
- Khoảng truy vấn dùng [from, to), from phải trước to.
- Top POI giới hạn 10.
- Không có export hoặc drill-down raw events trong UI/API hiện tại.
- Không tìm thấy scheduled purge usage_event trong source; không khẳng định retention 90 ngày.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input event | eventType | String | Có | poi_view/audio_play/session_start |
| Input event | poiId | Long | Không | POI liên quan |
| Input event | eventId | String | Không | Dedup key, tối đa 64 |
| Input query | from | Instant | Không | Bắt đầu UTC |
| Input query | to | Instant | Không | Kết thúc UTC |
| Output | totals | Map<String,Long> | Có | Tổng theo event type |
| Output | daily | DailyCount[] | Có | Số liệu theo ngày |
| Output | topPois | PoiViews[] | Có | Top 10 POI theo views |
| Output | generatedAt | Instant | Có | Thời điểm tổng hợp |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| POST | /api/v1/public/usage-events | Ghi event từ User | VISITOR grant |
| GET | /api/v1/admin/analytics/summary?from=&to= | Đọc Analytics | ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| ADMIN | Có | Session hợp lệ |
| SUPER_ADMIN | Không | 403 |
| VISITOR | Gửi event | Grant hợp lệ |
| User chưa redeem | Không | Không có visitor authority |

### 13. Điều kiện hậu

- Usage event hợp lệ được lưu trong usage_event.
- Analytics summary được tính từ raw usage events theo khoảng thời gian.
- Không thay đổi dữ liệu POI hoặc quyền truy cập.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC11-T01 | Ghi session_start | Visitor grant hợp lệ | Event được lưu |
| UC11-T02 | Ghi poi_view/audio_play | Event type hợp lệ | Event được lưu |
| UC11-T03 | Event type invalid | Giá trị ngoài whitelist | Validation error |
| UC11-T04 | Dedup event | eventId trùng | Không tạo bản ghi thứ hai |
| UC11-T05 | Summary default range | Không truyền from/to | 30 ngày gần nhất |
| UC11-T06 | Range invalid | from >= to | 400 |
| UC11-T07 | Role Super Admin | Gọi summary | 403 |
| UC11-T08 | Top POI | Có nhiều POI views | Tối đa 10, giảm dần |

Test hiện có: UsageEventServiceTest, AnalyticsServiceTest, AnalyticsFlowIT, AnalyticsPage.test.jsx.

---

# UC12 — TRA CỨU AUDIT LOG

### 1. Mã và tên

- Mã: UC12
- Tên: Tra cứu Audit Log.

### 2. Mục tiêu

Cho phép Super Admin tra cứu sự kiện quản trị/QR đã được backend ghi nhận, có lọc và phân trang.

### 3. Actor

- Actor chính: SUPER_ADMIN — tra cứu log.
- Actor phụ: Backend AuditService — ghi sự kiện từ application services và trả kết quả tìm kiếm.
- Actor phụ: ADMIN — tác nhân có thể xuất hiện trong log, không có quyền đọc log.

### 4. Điều kiện tiên quyết

- Super Admin đã đăng nhập.
- Có session hợp lệ.
- Audit Log có thể rỗng; trang vẫn phải hiển thị empty state.

### 5. Sự kiện kích hoạt

Super Admin mở /audit hoặc thay đổi bộ lọc tìm kiếm.

### 6. Luồng sự kiện chính

1. Super Admin mở trang Audit Log.
2. Frontend gọi GET /api/v1/admin/audit với page, size và các filter tùy chọn.
3. SecurityConfig xác minh SUPER_ADMIN.
4. AuditService chuẩn hóa filter và gọi AuditLogStore.search.
5. Backend trả các bản ghi mới nhất trước.
6. Frontend hiển thị thời gian, actor, action, resource, result và detail.
7. Super Admin thay đổi filter hoặc chuyển trang.
8. Frontend gọi lại API với query mới.

### 7. Luồng thay thế

- A1: Không có filter — trả danh sách mới nhất theo pagination.
- A2: UI hiện cho lọc action, actorId, resourceType và result. API còn nhận from/to nhưng trang Audit Log hiện chưa cung cấp điều khiển ngày giờ.
- A3: Không có bản ghi phù hợp — hiển thị empty state.

### 8. Luồng ngoại lệ

- E1: ADMIN gọi endpoint — 403.
- E2: Chưa đăng nhập/session hết hạn — 401.
- E3: Query parameter sai định dạng — 400.
- E4: Database lỗi — UI hiển thị error state.

### 9. Quy tắc nghiệp vụ

- Chỉ SUPER_ADMIN được đọc Audit Log.
- Controller chỉ cung cấp GET; không có API sửa/xóa log.
- UI filter action hiện thiếu option ADMIN_DELETE; bản ghi ADMIN_DELETE vẫn có thể xuất hiện trong danh sách không lọc.
- Backend ghi audit cho Admin account actions: ADMIN_CREATE, ADMIN_UPDATE, ADMIN_DELETE, ADMIN_RESET_PASSWORD.
- QR actions: QR_ISSUE, QR_REDEEM, QR_REVOKE.
- Audit write bắt buộc chạy trong transaction nghiệp vụ; nếu ghi log thất bại, thao tác nghiệp vụ bị rollback. DENIED event dùng transaction độc lập để tồn tại sau khi transaction nghiệp vụ rollback; nếu ghi DENIED event lỗi, quyết định từ chối vẫn được giữ.
- Actor được lấy từ authenticated principal hoặc null với system/visitor event.
- Detail chỉ chứa metadata an toàn; không lưu password, token QR dạng rõ hoặc bearer token.
- Audit hiện không bao phủ mọi thao tác POI/media/TTS; không mô tả log là bao phủ toàn bộ hoạt động hệ thống.
- API read-only không đồng nghĩa chống sửa đổi tuyệt đối trước SQL/database administrator.

### 10. Dữ liệu đầu vào / đầu ra

| Loại | Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Input | action | String | Không | Action filter |
| Input | actorId | Long | Không | Account actor |
| Input | resourceType | String | Không | Loại tài nguyên |
| Input | result | String | Không | SUCCESS/DENIED/FAILURE |
| Input | from | Instant | Không | API hỗ trợ; UI chưa có bộ lọc ngày giờ |
| Input | to | Instant | Không | API hỗ trợ; UI chưa có bộ lọc ngày giờ |
| Input | page | Integer | Không | Trang, mặc định 0 |
| Input | size | Integer | Không | Page size, mặc định 20 |
| Output | id | Long | Có | Audit ID |
| Output | occurredAt | Instant | Có | Thời điểm |
| Output | actorId/actorName | Long/String | Không | Tác nhân |
| Output | action | String | Có | Hành động |
| Output | resourceType/resourceId | String | Có thể null | Tài nguyên |
| Output | result | String | Có | Kết quả |
| Output | detail | String | Không | Metadata an toàn |

### 11. API liên quan

| Method | Endpoint | Mục đích | Authentication |
|---|---|---|---|
| GET | /api/v1/admin/audit | Tra cứu Audit Log | SUPER_ADMIN |

### 12. Quyền truy cập

| Actor / Role | Quyền thực hiện | Điều kiện |
|---|---|---|
| SUPER_ADMIN | Có | Session hợp lệ |
| ADMIN | Không | 403 |
| VISITOR | Không | Không có admin authority |

### 13. Điều kiện hậu

- Không thay đổi Audit Log.
- Super Admin nhận danh sách log theo filter và page.
- Các thao tác audit được ghi bởi backend tiếp tục được giữ trong database.

### 14. Tiêu chí nghiệm thu và kiểm thử

| ID | Kịch bản | Điều kiện kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| UC12-T01 | Tra cứu log | Super Admin, có records | Trả danh sách |
| UC12-T02 | Filter action | Action hợp lệ | Chỉ bản ghi khớp |
| UC12-T03 | Filter result | SUCCESS/DENIED/FAILURE | Kết quả đúng |
| UC12-T04 | Pagination | Page/size hợp lệ | Trả đúng trang |
| UC12-T05 | ADMIN truy cập | Role ADMIN | 403 |
| UC12-T06 | Không có log | Không có bản ghi phù hợp | Empty state |
| UC12-T07 | Audit sensitive data | Tạo/reset Admin hoặc QR | Không có plaintext password/token trong detail |

Test hiện có: AuditLogPage.test.jsx kiểm tra UI; Audit được kiểm tra gián tiếp qua AdminAccountServiceTest, AdminAccountFlowIT và AccessFlowIT. Không tìm thấy AuditServiceTest/AuditFlowIT độc lập trong danh sách test hiện tại.

---

## 4. Chức năng không đưa vào Use Case chính thức

Các mục sau được giữ trong audit nội bộ, không được mô tả như Use Case đã triển khai:

| Hạng mục | Trạng thái | Lý do |
|---|---|---|
| Offline POI/audio pack | CODE_ONLY | Có GET offline-manifest và service; Admin E2E script kiểm tra API nhưng Web User không gọi endpoint và không có UI tải/sử dụng offline pack |
| Mobile application | NOT_IMPLEMENTED | Không có apps/mobile trong repository hiện tại |
| Auto narration/geofence | NOT_IMPLEMENTED | Không có UI/service/route thực tế |
| Dynamic RBAC / permission editor | NOT_IMPLEMENTED, ngoài phạm vi | Chỉ có static roles ADMIN/SUPER_ADMIN |
| Seller management | NOT_IMPLEMENTED, ngoài phạm vi | Role/API/UI/schema Seller đã bị loại bỏ trong V6 |
| Payment / Order | NOT_IMPLEMENTED, ngoài phạm vi | Không có endpoint/service/schema hiện hành |
| Seller reports | NOT_IMPLEMENTED, ngoài phạm vi | Không có Seller analytics |
| Usage event retention purge | NOT_IMPLEMENTED | Không tìm thấy scheduled cleanup |
| Analytics QR status summary | CODE_ONLY | UI có nhánh render qrByStatus tùy chọn nhưng Summary backend hiện không trả trường này; không tính là metric đã triển khai |
| Audit toàn bộ thao tác POI/media/TTS | PARTIAL | Audit constants/service hiện ghi account và QR events; chưa bao phủ toàn bộ mutation |

## 5. Quy tắc về bằng chứng kiểm thử

- Test file tồn tại không đồng nghĩa đã chạy.
- Test PASS chỉ được ghi khi có output thực tế của lần chạy.
- Integration tests chưa chạy trong lượt audit 2026-10-30.
- Google Cloud TTS thật chưa được xác minh bằng credentials/provider thật.
- Frontend tests dùng mock không chứng minh database/API production hoạt động.
- Xem [DEVELOPMENT.md](DEVELOPMENT.md) để biết kết quả test của lượt audit.
