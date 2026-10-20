# BRD — Business Requirements Document
## Hệ thống Multitional-Translator-

- **Tên hệ thống:** Multitional-Translator-
- **Loại tài liệu:** Business Requirements Document (BRD)
- **Phiên bản:** 1.0 — bản dự thảo
- **Trạng thái:** Draft — cần xác nhận với chủ sản phẩm/các bên liên quan
- **Ngày lập:** 2026-10-20
- **Tài liệu nghiệp vụ tham chiếu:** `docs/requirements/Use_Case_Specification_Final_16_UC.md` và các sơ đồ trong `docs/requirements/Usecase/Mermaid/`

> **Quy ước:** Yêu cầu được tổng hợp từ đặc tả 16 Use Case hiện có. Các nội dung chưa được tài liệu xác định đầy đủ được ghi là **TBD (To Be Determined)**; không coi chúng là quyết định nghiệp vụ đã được phê duyệt. BRD mô tả nhu cầu và kết quả nghiệp vụ, không thay thế SRS, thiết kế kiến trúc hoặc kế hoạch kiểm thử.

---

## 1. Tóm tắt điều hành

Multitional-Translator- là hệ thống hỗ trợ khách du lịch khám phá các điểm tham quan (Point of Interest — POI) thông qua bản đồ tương tác, nội dung đa ngôn ngữ, hình ảnh và thuyết minh audio. Hệ thống hướng đến trải nghiệm trực tiếp khi có mạng cũng như tiếp tục sử dụng một phần chức năng khi offline thông qua tài nguyên đã tải trước.

Khu vực quản trị cho phép Admin quản lý dữ liệu POI và quy trình audio; Super Admin quản lý tài khoản và cấu hình vai trò/phân quyền. Hệ thống còn có các chức năng Analytics và Audit Log để hỗ trợ theo dõi hoạt động và quản trị.

BRD này xác định phạm vi nghiệp vụ, nhóm người dùng, các quy trình chính, quy tắc nghiệp vụ, yêu cầu chất lượng ở mức nghiệp vụ, tiêu chí nghiệm thu cấp cao và các điểm cần làm rõ trước khi chốt yêu cầu.

## 2. Bối cảnh và vấn đề nghiệp vụ

Khách du lịch có thể gặp khó khăn khi:
- Không hiểu thông tin địa điểm do khác biệt ngôn ngữ.
- Khó tìm POI và truy cập nhanh thông tin liên quan tại địa điểm thực tế.
- Muốn nghe thuyết minh mà không phải liên tục thao tác thủ công.
- Cần truy cập dữ liệu đã chuẩn bị khi kết nối mạng không ổn định.

Đơn vị vận hành cần:
- Quản lý POI, bản dịch, hình ảnh và audio ở một khu vực quản trị.
- Theo dõi tác vụ xử lý/tạo audio và trạng thái tài nguyên.
- Quản lý tài khoản quản trị, phân quyền và truy vết hoạt động.
- Xem các chỉ số vận hành/người dùng được hệ thống cung cấp.

## 3. Mục tiêu nghiệp vụ

| ID | Mục tiêu | Kết quả mong đợi |
|---|---|---|
| BO-01 | Giúp Tourist khám phá POI | Có thể tìm/chọn POI trên bản đồ và xem chi tiết |
| BO-02 | Hỗ trợ nhiều ngôn ngữ | Giao diện và nội dung POI chuyển ngôn ngữ theo trạng thái tài nguyên sẵn sàng |
| BO-03 | Cải thiện khả năng tiếp cận nội dung | Có thể nghe audio thủ công hoặc nhận thuyết minh theo vị trí |
| BO-04 | Hỗ trợ sử dụng khi mất mạng | Tourist quản lý và sử dụng các gói offline đã cài, trong giới hạn hỗ trợ |
| BO-05 | Chuẩn hóa vận hành nội dung | Admin quản lý POI và theo dõi xử lý audio |
| BO-06 | Kiểm soát truy cập quản trị | Có quản lý tài khoản và cơ chế phân quyền |
| BO-07 | Hỗ trợ quyết định vận hành | Cung cấp Analytics và Audit Log phù hợp quyền truy cập |

## 4. Phạm vi hệ thống

### 4.1 Trong phạm vi

- Đăng ký, đăng nhập và đăng xuất Tourist.
- Chọn/chuyển đổi ngôn ngữ giao diện và nội dung.
- Khám phá bản đồ, định vị và chọn POI.
- Xem chi tiết POI, nội dung bản dịch và hình ảnh.
- Phát audio thuyết minh theo yêu cầu.
- Kích hoạt thuyết minh tự động theo vị trí.
- Quản lý tài nguyên offline.
- Quản lý POI và trạng thái khả dụng/xuất bản.
- Theo dõi tác vụ xử lý/tạo audio.
- Quản lý tài khoản người dùng và tài khoản Admin.
- Quản lý role/permission theo RBAC.
- Xem Analytics.
- Tra cứu Audit Log.

### 4.2 Ngoài phạm vi hoặc chưa được xác nhận

Các nội dung sau không được xem là cam kết phạm vi cho đến khi có quyết định riêng:
- Thanh toán, đặt vé, đặt phòng hoặc thương mại điện tử.
- Điều hướng tuyến đường tối ưu giữa nhiều POI.
- Đánh giá, bình luận hoặc nội dung do cộng đồng đăng tải.
- Quản lý nhiều tổ chức/tenant.
- Tích hợp CRM hoặc hệ thống marketing.
- Xuất báo cáo Analytics hoặc drill-down nâng cao (đặc tả UC15 hiện không bao gồm).
- Xóa, xuất hoặc cấu hình retention của Audit Log (đặc tả UC16 không bao gồm).
- SLA, thời gian phản hồi, số người dùng đồng thời và thời gian lưu trữ dữ liệu cụ thể — cần xác nhận.

## 5. Các bên liên quan và nhóm người dùng

| Nhóm | Vai trò/nguyện vọng |
|---|---|
| Tourist | Đăng ký/đăng nhập, khám phá POI, chọn ngôn ngữ, nghe audio, quản lý dữ liệu offline |
| Admin | Quản lý POI/nội dung liên quan và giám sát tác vụ audio; xem Analytics khi có quyền |
| Super Admin | Quản lý tài khoản người dùng, tài khoản Admin và cấu hình role/permission; xem Audit Log |
| Chủ sản phẩm/đại diện nghiệp vụ | Xác nhận mục tiêu, ưu tiên, quy tắc nghiệp vụ và tiêu chí nghiệm thu |
| Đội phát triển/kiểm thử/vận hành | Phân tích, triển khai, kiểm thử, phát hành và hỗ trợ hệ thống |

**Lưu ý:** Phạm vi quyền thực tế phải được đối chiếu giữa yêu cầu UC, giao diện và backend. Không giả định rằng mọi quyền được mô tả trong BRD đã được triển khai.

## 6. Tổng quan 16 Use Case

### 6.1 Nhóm Tourist

| ID | Use Case | Yêu cầu nghiệp vụ tóm tắt |
|---|---|---|
| BR-UC01 | Đăng ký tài khoản | Cho phép Tourist tạo tài khoản với dữ liệu hợp lệ; từ chối username trùng |
| BR-UC02 | Đăng nhập | Xác thực thông tin và chỉ tạo phiên khi hợp lệ |
| BR-UC03 | Đăng xuất | Kết thúc trạng thái xác thực và trở về Login |
| BR-UC04 | Chọn/chuyển đổi ngôn ngữ | Chỉ áp dụng locale mới khi UI bundle và nội dung POI sẵn sàng |
| BR-UC05 | Khám phá bản đồ tương tác | Hiển thị bản đồ/POI, hỗ trợ pan/zoom, định vị và chọn POI |
| BR-UC06 | Xem chi tiết POI | Hiển thị thông tin, bản dịch khả dụng, hình ảnh và metadata |
| BR-UC07 | Nghe thuyết minh POI | Phát audio phù hợp với POI/ngôn ngữ khi có tài nguyên |
| BR-UC08 | Thuyết minh tự động theo vị trí | Phát narration khi điều kiện vị trí/geofence được đáp ứng và có nguồn audio |
| BR-UC09 | Quản lý dữ liệu offline | Tải, kiểm tra, kích hoạt, cập nhật và gỡ tài nguyên offline |

### 6.2 Nhóm quản trị

| ID | Use Case | Yêu cầu nghiệp vụ tóm tắt |
|---|---|---|
| BR-UC10 | Quản lý POI | Tạo, xem, sửa, xóa, cập nhật ảnh và trạng thái khả dụng/xuất bản theo quyền |
| BR-UC11 | Giám sát tiến độ tạo Audio | Theo dõi trạng thái tác vụ audio; thao tác điều khiển phụ thuộc khả năng thực tế được xác nhận |
| BR-UC12 | Quản lý tài khoản người dùng | Super Admin quản lý account người dùng trong phạm vi được phép |
| BR-UC13 | Quản lý tài khoản Admin | Super Admin quản lý account Admin; account mới mặc định role admin theo đặc tả |
| BR-UC14 | Quản lý role và phân quyền (RBAC) | Tạo/sửa/xóa role và cấu hình permission array theo registry hợp lệ |
| BR-UC15 | Xem Analytics | Người có quyền xem các metric được hỗ trợ và lọc theo các điều kiện quy định |
| BR-UC16 | Xem Audit Log | Super Admin tra cứu bản ghi audit bằng tìm kiếm/lọc/sắp xếp/phân trang |

Chi tiết luồng chính, ngoại lệ và quan hệ giữa các Use Case nằm trong tài liệu đặc tả Use Case tham chiếu; BRD này là bản tổng hợp yêu cầu ở cấp nghiệp vụ.

## 7. Yêu cầu nghiệp vụ chi tiết

### 7.1 Tài khoản và phiên đăng nhập

- **BR-AUTH-01:** Hệ thống phải cho phép Tourist đăng ký bằng username và mật khẩu theo quy tắc đã chốt.
- **BR-AUTH-02:** Username phải được kiểm tra trùng không phân biệt chữ hoa/chữ thường.
- **BR-AUTH-03:** Hệ thống không tạo tài khoản nếu dữ liệu đăng ký không hợp lệ.
- **BR-AUTH-04:** Đăng ký thành công không tự động đăng nhập; Tourist đăng nhập riêng.
- **BR-AUTH-05:** Đăng nhập sai không được tạo phiên xác thực.
- **BR-AUTH-06:** Đăng xuất phải đưa giao diện về trạng thái chưa xác thực kể cả khi phiên phía máy chủ đã hết hiệu lực.
- **BR-AUTH-07:** Tài khoản và quyền quản trị phải được bảo vệ; thao tác quản trị chỉ được thực hiện khi người dùng có quyền phù hợp.

### 7.2 Ngôn ngữ và nội dung POI

- **BR-LANG-01:** Tourist có thể chọn ngôn ngữ trong danh sách được hỗ trợ.
- **BR-LANG-02:** Giao diện và nội dung POI phải được quản lý như các tài nguyên riêng biệt.
- **BR-LANG-03:** Hệ thống chỉ áp dụng ngôn ngữ đích khi tài nguyên giao diện và nội dung cần thiết sẵn sàng.
- **BR-LANG-04:** Nếu bản dịch không đầy đủ, hệ thống phải hiển thị phần nội dung khả dụng và báo tình trạng thiếu bản dịch.
- **BR-LANG-05:** Quy tắc fallback và quan hệ giữa UI locale, content locale và audio locale phải nhất quán trong toàn hệ thống.

### 7.3 Bản đồ và POI

- **BR-POI-01:** Tourist phải có thể khám phá POI trên bản đồ.
- **BR-POI-02:** Hệ thống phải hỗ trợ pan/zoom và chọn POI; hỗ trợ cụm marker khi áp dụng.
- **BR-POI-03:** Khi được cấp quyền vị trí, Tourist có thể yêu cầu định vị bản thân trên bản đồ.
- **BR-POI-04:** Khi không có quyền vị trí, người dùng vẫn có thể tiếp tục khám phá bằng tâm bản đồ hiện tại/mặc định.
- **BR-POI-05:** Chi tiết POI phải thể hiện các trường nội dung và media mà hệ thống có sẵn.
- **BR-POI-06:** Admin phải có thể tạo, xem, sửa, xóa và cập nhật trạng thái POI theo quyền.
- **BR-POI-07:** Hệ thống không được công khai POI chưa đáp ứng điều kiện readiness đã được định nghĩa.
- **BR-POI-08:** Các thay đổi POI phải cập nhật trạng thái tài nguyên liên quan khi có ảnh hưởng đến audio/readiness.

### 7.4 Thuyết minh audio

- **BR-AUDIO-01:** Tourist có thể chủ động phát audio từ chi tiết POI khi tài nguyên phù hợp khả dụng.
- **BR-AUDIO-02:** Hệ thống phải thông báo rõ khi audio không khả dụng hoặc tải/phát thất bại.
- **BR-AUDIO-03:** Thuyết minh tự động chỉ bắt đầu khi dữ liệu vị trí đạt điều kiện chất lượng và điều kiện geofence.
- **BR-AUDIO-04:** Theo đặc tả hiện tại, geofence mặc định có bán kính 30 m và thời gian xác nhận ở trong vùng 3 giây; các giá trị này cần được chủ sản phẩm xác nhận trước khi phát hành.
- **BR-AUDIO-05:** Khi nhiều vùng POI chồng lấn hoặc narration khác đang phát, hệ thống phải áp dụng chính sách lựa chọn/ưu tiên nhất quán.
- **BR-AUDIO-06:** Admin phải xem được trạng thái xử lý audio.
- **BR-AUDIO-07:** Tác vụ audio thất bại hoặc bị gián đoạn phải có trạng thái hiển thị; không được báo thành công khi chưa có tài nguyên hợp lệ.
- **BR-AUDIO-08:** Cơ chế tạo audio, thao tác Pause/Resume/Cancel và phương thức cập nhật trạng thái cần khớp giữa đặc tả, giao diện và backend.

### 7.5 Offline

- **BR-OFF-01:** Tourist phải xem được trạng thái tài nguyên offline hiện có.
- **BR-OFF-02:** Trước khi tải, hệ thống phải kiểm tra điều kiện dung lượng và khả năng lấy manifest khi các bước này được yêu cầu.
- **BR-OFF-03:** Chỉ tài nguyên tải đầy đủ và vượt qua kiểm tra integrity mới được kích hoạt.
- **BR-OFF-04:** Hệ thống phải cho biết kết quả tải/cập nhật hoặc nguyên nhân thất bại.
- **BR-OFF-05:** Tourist có thể deactivate/gỡ tài nguyên sau khi xác nhận.
- **BR-OFF-06:** Giao diện không được hứa hẹn khả năng offline cho tài nguyên chưa tải hoặc chức năng phụ thuộc dịch vụ mạng.

### 7.6 Quản trị tài khoản và RBAC

- **BR-ADMIN-01:** Super Admin phải quản lý được account người dùng theo các thao tác được hỗ trợ.
- **BR-ADMIN-02:** Super Admin phải quản lý được account Admin trong phạm vi role admin.
- **BR-ADMIN-03:** Account Admin mới mặc định có role admin; gán/đổi role thuộc UC14.
- **BR-RBAC-01:** Một account có một role theo đặc tả hiện hành.
- **BR-RBAC-02:** Permission được gán thông qua role; không gán permission trực tiếp cho từng account.
- **BR-RBAC-03:** Tên role phải duy nhất và permission array chỉ chứa permission thuộc registry được công nhận.
- **BR-RBAC-04:** Không được xóa system role hoặc role đang được sử dụng.
- **BR-RBAC-05:** Backend phải kiểm tra quyền ở các thao tác được bảo vệ; ẩn nút trên UI không thay thế kiểm tra quyền phía máy chủ.
- **BR-RBAC-06:** Danh sách permission registry, ý nghĩa của từng permission và mapping role mặc định phải được chủ sản phẩm phê duyệt.

### 7.7 Analytics và Audit Log

- **BR-AN-01:** Người dùng có quyền Analytics phải xem được các metric: today_views, audio_plays, searches, top_pois và tracked_online_users theo định nghĩa dữ liệu được thống nhất.
- **BR-AN-02:** Dashboard phải hỗ trợ date range và các filter đã nêu trong đặc tả: POI, device, language, region và event type.
- **BR-AN-03:** Chỉ thu thập/trình bày dữ liệu tracking theo cơ chế consent được hệ thống quy định.
- **BR-AN-04:** Khi nguồn Analytics không khả dụng, hệ thống phải thông báo lỗi và cho phép thử lại.
- **BR-AUD-01:** Super Admin có quyền phải xem được các trường audit cơ bản: action, user_id, resource và timestamp.
- **BR-AUD-02:** Audit Log phải hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang theo đặc tả.
- **BR-AUD-03:** Thao tác xem Audit Log không được làm thay đổi bản ghi.
- **BR-AUD-04:** Quy tắc ghi nhận sự kiện audit, retention và bảo vệ log cần được xác định trong yêu cầu vận hành riêng nếu thuộc phạm vi phát hành.

## 8. Quy tắc nghiệp vụ tổng hợp

| ID | Quy tắc |
|---|---|
| RULE-01 | Username không phân biệt hoa/thường khi kiểm tra trùng |
| RULE-02 | Password tối thiểu 6 ký tự; Confirm Password phải khớp |
| RULE-03 | Đăng ký thành công không tự động tạo phiên đăng nhập |
| RULE-04 | Chỉ chuyển locale khi UI bundle và POI content cần thiết đã sẵn sàng |
| RULE-05 | Thiếu bản dịch không đồng nghĩa toàn bộ chi tiết POI phải bị ẩn |
| RULE-06 | Audio không khả dụng phải được thông báo; không giả lập trạng thái phát thành công |
| RULE-07 | Auto narration cần vị trí đủ chính xác và điều kiện geofence hợp lệ |
| RULE-08 | Tài nguyên offline chỉ được kích hoạt sau khi kiểm tra tính đầy đủ/toàn vẹn |
| RULE-09 | POI chưa đủ readiness không được public |
| RULE-10 | Account có một role; quyền được cấp thông qua role |
| RULE-11 | Không xóa role hệ thống hoặc role đang được sử dụng |
| RULE-12 | Các quyền phải được kiểm tra phía backend đối với protected operations |
| RULE-13 | Analytics phải tuân theo semantics dữ liệu và consent hiện hành |
| RULE-14 | Thao tác xem Audit Log không sửa đổi dữ liệu audit |

## 9. Yêu cầu dữ liệu nghiệp vụ

Các nhóm dữ liệu chính được suy ra từ Use Case:
- **Account:** thông tin tài khoản, trạng thái và role.
- **Role/Permission:** tên role, permission array và registry permission.
- **POI:** định danh, nội dung, metadata, trạng thái khả dụng/xuất bản và dữ liệu vị trí.
- **POI Translation:** nội dung theo ngôn ngữ.
- **Media:** hình ảnh, audio asset và metadata tài nguyên.
- **Audio Task/Job:** trạng thái, tiến độ nếu có, kết quả và thông tin lỗi.
- **Offline Resource:** bundle/pack, phiên bản, trạng thái cài đặt và kết quả kiểm tra integrity.
- **Analytics:** metrics/read models và các chiều lọc được hỗ trợ.
- **Audit Record:** action, user_id, resource, timestamp.

Chi tiết schema, bắt buộc/tùy chọn, retention, mã định danh, quy tắc xóa và phân loại dữ liệu nhạy cảm phải được xác định trong SRS/data dictionary và chính sách dữ liệu.

## 10. Yêu cầu phi chức năng ở cấp nghiệp vụ

Các mục dưới đây là yêu cầu cần được chốt; các giá trị định lượng chưa có trong đặc tả được đánh dấu TBD.

| ID | Nhóm | Yêu cầu | Mức/giá trị |
|---|---|---|---|
| NFR-01 | Bảo mật | Xác thực và phân quyền phải được kiểm tra ở backend | Bắt buộc |
| NFR-02 | Quyền riêng tư | Tracking Analytics phải tuân theo consent | Bắt buộc theo đặc tả |
| NFR-03 | Tính toàn vẹn | Bundle offline chỉ kích hoạt sau kiểm tra integrity | Bắt buộc |
| NFR-04 | Khả dụng | Khi dịch vụ/tài nguyên không khả dụng, hiển thị lỗi có thể hiểu và không báo thành công sai | Bắt buộc |
| NFR-05 | Khả năng sử dụng | Luồng đăng nhập, chọn POI, xem chi tiết và phát audio cần có trạng thái/lỗi rõ ràng | Bắt buộc |
| NFR-06 | Đa ngôn ngữ | UI, nội dung POI và audio locale phải được xử lý nhất quán | Bắt buộc |
| NFR-07 | Hiệu năng | Thời gian phản hồi cho map, detail, API, Analytics và audio | TBD |
| NFR-08 | Khả năng mở rộng | Số Tourist đồng thời, POI, ngôn ngữ và tác vụ audio đồng thời | TBD |
| NFR-09 | Độ tin cậy | Chính sách retry, phục hồi job, backup/restore và RPO/RTO | TBD |
| NFR-10 | Tương thích | Phiên bản OS, trình duyệt, thiết bị và quyền vị trí hỗ trợ | TBD |
| NFR-11 | Quan sát hệ thống | Log lỗi và trạng thái tác vụ phải đủ để chẩn đoán sự cố | TBD |
| NFR-12 | Trợ năng | Hỗ trợ accessibility cho giao diện và thao tác chính | TBD |

## 11. Tiêu chí nghiệm thu cấp cao

| ID | Điều kiện nghiệm thu |
|---|---|
| AC-01 | Đăng ký từ chối dữ liệu không hợp lệ và username trùng; tài khoản hợp lệ được tạo mà không tự đăng nhập |
| AC-02 | Đăng nhập sai không tạo phiên; đăng nhập đúng đưa Tourist vào ứng dụng; logout luôn đưa UI về Login |
| AC-03 | Đổi ngôn ngữ không để UI và POI content ở hai trạng thái locale không nhất quán |
| AC-04 | Tourist có thể khám phá bản đồ và mở chi tiết POI; lỗi quyền vị trí không chặn toàn bộ thao tác khám phá |
| AC-05 | Chi tiết POI hiển thị nội dung khả dụng và thông báo khi thiếu bản dịch |
| AC-06 | Audio khả dụng phát được; audio thiếu/lỗi phải thông báo rõ |
| AC-07 | Auto narration chỉ kích hoạt khi điều kiện vị trí/geofence đạt yêu cầu và chính sách xung đột được áp dụng |
| AC-08 | Tài nguyên offline không hợp lệ hoặc chưa hoàn tất không được kích hoạt |
| AC-09 | Admin chỉ thực hiện được thao tác POI/audio phù hợp quyền; trạng thái xử lý được hiển thị đúng |
| AC-10 | Super Admin quản lý account theo phạm vi; đổi role được thực hiện qua RBAC |
| AC-11 | Role trùng tên, permission không hợp lệ và xóa role đang dùng/system role bị từ chối |
| AC-12 | Analytics chỉ hiển thị dữ liệu và bộ lọc được hỗ trợ cho người có quyền |
| AC-13 | Audit Log có thể tìm kiếm/lọc/sắp xếp/phân trang; thao tác xem không sửa dữ liệu |
| AC-14 | Các lỗi phụ thuộc mạng, tài nguyên hoặc dịch vụ đều có trạng thái lỗi rõ ràng; không hiển thị thành công giả |

Các tiêu chí trên là cấp cao. Bộ kiểm thử chi tiết phải được xây dựng riêng, bao gồm điều kiện tiền đề, dữ liệu kiểm thử, bước thực hiện và kết quả mong đợi.

## 12. Giả định, ràng buộc và phụ thuộc

### 12.1 Giả định
- Đặc tả 16 Use Case là nguồn nghiệp vụ nền tảng hiện tại.
- Tourist là người sử dụng ứng dụng; Admin và Super Admin là các vai trò quản trị.
- Khả năng offline bị giới hạn bởi tài nguyên đã tải và tính năng không phụ thuộc dịch vụ mạng.
- Audio có thể là tài nguyên đã có hoặc được tạo bởi quy trình xử lý phù hợp.

### 12.2 Ràng buộc
- UI bundle và nội dung POI phải sẵn sàng trước khi áp dụng chuyển ngôn ngữ.
- Vị trí người dùng cần được cấp quyền và đạt điều kiện độ chính xác cho auto narration.
- Tài nguyên offline phải qua kiểm tra toàn vẹn.
- Protected operations phải kiểm tra quyền phía backend.
- Analytics tracking phải tuân theo cơ chế consent.

### 12.3 Phụ thuộc
- Dịch vụ xác thực và lưu trữ tài khoản.
- Dữ liệu POI, bản dịch và media.
- Dịch vụ bản đồ, định vị và nguồn dữ liệu local/cloud.
- Audio storage/player và nhà cung cấp TTS nếu được cấu hình.
- Kho tài nguyên offline và manifest.
- Analytics read models, consent state và audit store.

## 13. Rủi ro nghiệp vụ

| ID | Rủi ro | Tác động | Hướng xử lý đề xuất |
|---|---|---|---|
| R-01 | Đặc tả và mã nguồn không đồng bộ | Nghiệm thu sai hoặc thiếu chức năng | Lập ma trận truy vết Use Case → API → UI → test |
| R-02 | Ngôn ngữ UI/content/audio bị lệch | Trải nghiệm khó hiểu | Chốt quy tắc locale và fallback |
| R-03 | GPS thiếu chính xác hoặc geofence chồng lấn | Phát narration sai POI | Chốt threshold, debounce và ưu tiên POI; kiểm thử thực địa |
| R-04 | TTS/nguồn audio không khả dụng | Không có narration | Có trạng thái lỗi, phương án upload audio và kiểm tra tích hợp thật |
| R-05 | Offline pack thiếu hoặc hỏng | Không dùng được khi mất mạng | Kiểm tra manifest, integrity và trạng thái kích hoạt |
| R-06 | RBAC mới có role tĩnh hoặc UI-only | Rủi ro truy cập trái phép | Xác minh enforcement backend và phạm vi quyền |
| R-07 | Metrics không thống nhất | Quyết định vận hành sai | Định nghĩa metric, time window, consent và nguồn dữ liệu |
| R-08 | Audit không đầy đủ | Khó truy vết thao tác quản trị | Chốt sự kiện cần audit và chính sách lưu trữ |

## 14. Các vấn đề cần chủ sản phẩm xác nhận (TBD)

1. **Đối tượng và mô hình tài khoản:** Tourist có được sử dụng một số chức năng không cần đăng nhập không? Tài khoản bị khóa/xóa được xử lý thế nào?
2. **Ngôn ngữ:** Danh sách locale chính thức, fallback chain và cách chọn audio locale.
3. **POI:** Các trường bắt buộc, điều kiện readiness để publish, quy tắc xóa POI có dữ liệu liên quan.
4. **Audio/TTS:** Nhà cung cấp chính thức, định dạng, giọng đọc, giới hạn đầu vào, retry, thời gian chờ, chi phí và hành vi fallback.
5. **Auto narration:** Có cho phép tự phát mặc định không? Chính sách khi audio đang phát, khi nhiều POI gần nhau và khi người dùng tắt tính năng.
6. **Offline:** Giới hạn dung lượng, phiên bản pack, cập nhật/xóa dữ liệu, chính sách hết hạn và phạm vi chức năng offline.
7. **RBAC:** Danh sách role mặc định, ma trận role-permission, ai được tạo Admin, có bảo vệ Super Admin cuối cùng hay không.
8. **Analytics:** Công thức metric, múi giờ/ngày thống kê, sliding window, phạm vi dữ liệu và cách xử lý rút consent.
9. **Audit:** Những sự kiện bắt buộc ghi log, retention, quyền truy cập, bảo vệ khỏi chỉnh sửa và nhu cầu export.
10. **Phi chức năng:** Mục tiêu hiệu năng, tải đồng thời, SLA/availability, backup, RPO/RTO và hỗ trợ thiết bị.
11. **Bảo mật và tuân thủ:** Chính sách mật khẩu, khóa tài khoản, thời hạn session, dữ liệu cá nhân và thời hạn lưu trữ.
12. **Phát hành/nghiệm thu:** Môi trường triển khai, người phê duyệt và định nghĩa hoàn thành cho từng Use Case.

## 15. Ưu tiên triển khai đề xuất

Thứ tự dưới đây là đề xuất lập kế hoạch, không phải thứ tự ưu tiên đã được chủ sản phẩm phê duyệt.

| Mức | Nhóm | Lý do |
|---|---|---|
| P0 | Xác thực, quyền truy cập và mô hình account/role | Là nền tảng bảo vệ các chức năng còn lại |
| P0 | CRUD POI, bản dịch và media | Cung cấp dữ liệu cho trải nghiệm Tourist |
| P0 | Phát audio và trạng thái xử lý audio | Hoàn thiện luồng thuyết minh chính |
| P1 | Bản đồ, locale và chi tiết POI đầu cuối | Đảm bảo hành trình khám phá hoạt động nhất quán |
| P1 | Offline packs và auto narration | Tăng khả năng sử dụng ngoài điều kiện mạng ổn định |
| P1 | Audit Log | Hỗ trợ truy vết thay đổi quản trị |
| P2 | Analytics và cải thiện khả năng quan sát | Hỗ trợ theo dõi vận hành; phụ thuộc dữ liệu đo lường đáng tin cậy |

## 16. Ma trận truy vết

| Mục tiêu | Use Case liên quan |
|---|---|
| BO-01 — Khám phá POI | UC05, UC06, UC10 |
| BO-02 — Đa ngôn ngữ | UC04, UC06, UC07, UC08 |
| BO-03 — Thuyết minh | UC07, UC08, UC10, UC11 |
| BO-04 — Offline | UC09, UC05–UC08 |
| BO-05 — Vận hành nội dung | UC10, UC11 |
| BO-06 — Quản trị và phân quyền | UC01–UC03, UC12, UC13, UC14 |
| BO-07 — Giám sát và truy vết | UC15, UC16 |

## 17. Phê duyệt

| Vai trò | Người phê duyệt | Trạng thái | Ngày |
|---|---|---|---|
| Chủ sản phẩm/đại diện nghiệp vụ | TBD | Chưa phê duyệt | TBD |
| Đại diện kỹ thuật | TBD | Chưa phê duyệt | TBD |
| Đại diện kiểm thử/nghiệm thu | TBD | Chưa phê duyệt | TBD |

---

## Lịch sử phiên bản

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 1.0 | 2026-10-20 | Tạo bản dự thảo BRD từ bộ 16 Use Case hiện có |
