# Kế hoạch chuẩn hóa ma trận quyền và loại bỏ Seller

**Ngày chốt quyết định:** 2026-10-29
**Trạng thái thực thi:** Đang hoàn tất triển khai. Backend/UI đã được chỉnh; Flyway V6 đã áp dụng trên Neon production và hậu kiểm đạt. Chưa commit. Blocker vận hành còn lại: production có 0 Super Admin active; không tự tạo tài khoản đặc quyền khi chưa có thông tin bootstrap được ủy quyền.
**Phạm vi:** Backend/API, Web Admin, Web User, schema/migration, dữ liệu hiện hữu, kiểm thử và tài liệu.

## Tóm tắt thực thi 2026-10-29

| Hạng mục | Trạng thái |
|---|---|
| Backend role/API, Seller removal | Đã chỉnh; unit tests PASS |
| Web Admin role/routes/QR/account UI | Đã chỉnh; 56 tests, lint/build PASS |
| Web User | 73 tests, lint và build PASS |
| Production migration/data | V6 áp dụng và hậu kiểm PASS |
| Tài liệu | Đang đồng bộ toàn bộ README/Use Case/API/architecture/reports |
| Commit | Chưa tạo; chờ rà soát diff cuối |
| Blocker vận hành | Không có Super Admin active trong production; cần bootstrap có ủy quyền |
## 1. Quyết định đã chốt

| Vai trò | Quyền được phép |
|---|---|
| User/khách tham quan | Kích hoạt QR hợp lệ; truy cập bản đồ, xem POI và nghe thuyết minh theo grant hợp lệ. |
| Admin | Quản lý POI, bản dịch, media; quản lý QR theo hành vi hiện tại; xem Analytics toàn hệ thống. |
| Super Admin | Quản lý tài khoản Admin: tạo, xem danh sách/chi tiết, sửa thông tin, khóa/mở khóa, reset mật khẩu, xóa mềm; xem Audit Log. |
| Seller | Loại bỏ hoàn toàn: không còn role, tài khoản, endpoint, UI, báo cáo hay nghiệp vụ riêng. |

- Admin và Super Admin dùng chung ứng dụng quản trị/đăng nhập; menu, route và thao tác thay đổi theo role.
- Giữ đăng nhập/đăng xuất cho User theo luồng kích hoạt/grant hiện có và cho hai role tài khoản quản trị ADMIN, SUPER_ADMIN; không tự bổ sung hồ sơ cá nhân, đổi mật khẩu cá nhân hoặc quyền khác chưa được duyệt.
- Analytics chỉ dành cho Admin; Super Admin bị từ chối kể cả gọi API trực tiếp.
- Super Admin không được dùng API nghiệp vụ Admin; chỉ được quản lý tài khoản Admin và đọc Audit Log.
- UC12 chỉ còn quản lý QR hiện có; không triển khai thanh toán/đơn hàng.
- Không triển khai dynamic RBAC. Quyền là policy tĩnh, deny-by-default.
- Đã ghi nhận yêu cầu xóa tài khoản Seller và dữ liệu riêng liên quan trên production mà không cần backup. Đây là thao tác phá hủy; trước khi chạy vẫn phải xác minh đúng DB/branch, preview số lượng/quan hệ bị ảnh hưởng, dùng thao tác idempotent và hậu kiểm. Không chạy xóa production trong giai đoạn audit/kế hoạch.

## 2. Trạng thái sau triển khai và hậu kiểm

- Branch `main`, HEAD gốc `15092db`; working tree đã có thay đổi staged/unstaged trước nhiệm vụ. Các thay đổi có sẵn được bảo toàn, không reset/clean.
- `AccountRole` hiện chỉ có `ADMIN`/`SUPER_ADMIN`; `SecurityConfig` đặt matcher Accounts/Audit/Analytics trước matcher Admin tổng quát; default deny.
- Seller controller/service/repository/DTO/API/client/page/menu và Seller report đã được gỡ khỏi source; QR request/DTO/service không còn `sellerUsername` hoặc `seller_id`.
- UC10 quản lý tài khoản Admin: list/detail/create/update enabled/display name/reset password/soft delete; role được cố định là ADMIN và target chỉ được phép là Admin.
- Migration V6 `remove seller role and data` đã áp dụng trên Neon primary branch `production`, DB `neondb`; Flyway history version 6 SUCCESS.
- Post-check: Seller accounts 0; cột `access_qr.seller_id`/index không còn; role constraint chỉ nhận ADMIN/SUPER_ADMIN; QR=1, grant=1, usage events=0, audit rows=2; FK chưa validate=0.
- Production có 1 Admin active và 0 Super Admin. Không promote Admin tự động và không tạo mật khẩu Super Admin ngẫu nhiên vì đó là thay đổi đặc quyền chưa được cấp thông tin/ủy quyền bootstrap.
- Backend unit tests 60/60; Admin UI tests 56/56; Admin lint/build PASS. Integration tests chưa chạy do không có DB test được xác minh; không dùng production làm test target.
## 3. Ma trận quyền đích

| Tài nguyên/hoạt động | User | Admin | Super Admin |
|---|---:|---:|---:|
| Đăng nhập/đăng xuất | Có theo luồng User hiện có | Có | Có |
| Kích hoạt QR hợp lệ | Có | Không thay User kích hoạt | Không |
| Bản đồ/POI/thuyết minh | Có khi grant hợp lệ | Không qua quyền quản trị | Không qua quyền quản trị |
| Quản lý POI/bản dịch/media | Không | Có | 403 |
| Tạo/xem/thu hồi QR quản trị | Không | Có, giữ như hiện tại | 403 |
| Analytics toàn hệ thống | Không | Có | 403 |
| Quản lý tài khoản Admin | Không | 403 | Có |
| Xem Audit Log | Không | 403 | Có |
| Seller management/report/API | Không tồn tại | Không tồn tại | Không tồn tại |
| Dynamic RBAC | Không | Không | Không |

Quyền User được cấp bởi QR/grant hợp lệ, không phải role quản trị USER trong bảng account.

## 4. Kế hoạch theo giai đoạn

### P0 — Baseline và dữ liệu
1. Ghi lại branch/HEAD/working tree trước thay đổi.
2. Xác minh đúng Neon project/branch mà không in connection string hoặc secret.
3. Đọc FK, index, constraint và lập bảng đếm account Seller, QR, grant, usage events, audit rows sẽ bị ảnh hưởng.
4. Phân loại Seller-only data với dữ liệu dùng chung; xác định audit nào xóa và audit nào giữ.
5. Chốt mapping Use Case; không thêm quyền ngoài ma trận.

### P1 — Backend/API
1. Thu hẹp /api/v1/admin/analytics/** về ADMIN.
2. Giữ /api/v1/admin/accounts/** và /api/v1/admin/audit/** cho SUPER_ADMIN; /api/v1/admin/** cho ADMIN, matcher cụ thể đứng trước matcher tổng quát.
3. Gỡ Seller controller/service/repository/DTO và /api/v1/seller/reports/**.
4. Gỡ SELLER khỏi enum, validation, bootstrap/config, query account, principal/session/auth và OpenAPI.
5. Bỏ sellerUsername khỏi QR request/service/UI; bỏ seller_id khỏi model/schema nếu audit xác nhận không còn dùng.
6. Bảo đảm QR redeem, public content và media vẫn kiểm tra grant như hiện tại.

### P2 — Hai Web UI
1. Xóa Seller page, route, menu, API client, mock handler, Seller reports và test liên quan.
2. Giữ trang QR cho Admin, bỏ hoàn toàn chọn/gán Seller.
3. Analytics chỉ hiện và truy cập được với Admin; URL trực tiếp phải bị chặn theo role.
4. Super Admin chỉ có Accounts và Audit Log ngoài đăng nhập/đăng xuất.
5. Kiểm tra User web: QR activation, map, POI và audio không bị ảnh hưởng.
6. Chuẩn hóa 401/403 và thông báo lỗi; backend là nguồn quyết định cuối.

### P3 — Schema và xóa dữ liệu
1. Tạo migration mới append-only; không sửa migration đã áp dụng.
2. Loại Seller khỏi constraint/schema và code; bỏ seller_id/index nếu không còn dùng.
3. Xóa account Seller và dữ liệu riêng theo FK dependency đã xác minh; chỉ xóa QR/grant/usage event chứng minh thuộc Seller.
4. Xử lý audit theo policy đã chốt; không xóa log của Admin/Super Admin hoặc sự kiện dùng chung.
5. Kiểm tra lại FK, constraint, row counts, không còn Seller, QR Admin/User và grant không liên quan vẫn còn nguyên.
6. Với production: xác nhận target → dry-run/count → transaction → hậu kiểm. Không bỏ qua xác minh target dù không yêu cầu backup.

### P4 — Kiểm thử
- Unit tests: role, lifecycle tài khoản, QR issue/list/revoke, Analytics authorization, Admin account management, Audit access.
- API integration: role được phép và bị từ chối cho từng endpoint, gồm truy cập trực tiếp.
- ADMIN đọc Analytics thành công; SUPER_ADMIN nhận 403 ở Analytics, POI, media, QR; ADMIN nhận 403 ở Admin accounts/Audit Log.
- Seller token/session cũ không được phép; endpoint /api/v1/seller/** không còn nghiệp vụ.
- UI tests: navigation, route trực tiếp, QR không có Seller, Analytics Admin-only, Super Admin chỉ Accounts/Audit.
- Web User regression: redeem, grant, map, POI, audio.
- Chạy backend ./mvnw.cmd clean verify với DB test riêng; hai Web UI chạy lint/test/build. Không dùng production làm DB test.

### P5 — Tài liệu và nghiệm thu
- Đồng bộ BRD, 15 UC, API contract/OpenAPI, architecture, backlog, plan/assumptions, README, feature README, testing/deployment.
- Xóa mô tả Seller, Seller reports, seller-owned QR và thanh toán Seller; định nghĩa UC12 là quản lý QR hiện có.
- Cập nhật ma trận quyền, endpoint matrix, 401/403, data model và migration.
- Search toàn repo các chuỗi SELLER, Seller, seller_id, /api/v1/seller, sellerUsername, UC09, UC13; phân loại hoặc loại bỏ mọi kết quả còn lại.
- Chỉ ghi kết quả kiểm thử sau khi chạy thật; không tái sử dụng báo cáo lịch sử như kết quả mới.

## 5. Tiêu chí hoàn thành

- Không còn role Seller được cấp hoặc chấp nhận.
- Backend chặn truy cập trái phép ngay cả khi gọi trực tiếp API.
- Analytics chỉ Admin; Super Admin chỉ quản lý Admin và đọc Audit Log ngoài login/logout.
- Admin quản lý POI, bản dịch, media, QR; User vẫn kích hoạt QR hợp lệ, xem bản đồ/POI, nghe audio.
- Không còn UI/API/service/DTO/query/schema riêng cho Seller; QR UI không còn gán Seller.
- Dữ liệu Seller đã được xử lý theo dependency đã xác minh, không xóa nhầm QR/grant/audit ngoài phạm vi.
- Backend và hai Web UI test/build đạt; tài liệu nhất quán; diff được rà soát trước commit.
- Không push/deploy nếu chưa được yêu cầu rõ.

## 6. Tài liệu cần đồng bộ

- docs/requirements/BRD.md
- docs/requirements/Use_Case_Specification_Final_15_UC.md
- docs/architecture/api.md
- docs/architecture/architecture.md
- docs/architecture/phase-1-contract-baseline.md
- docs/planning/backlog.md
- docs/planning/plan-and-assumptions.md
- docs/reports/current-state-inventory.md
- docs/reports/verification-report.md
- docs/reports/admin-module-verification.md
- docs/development/testing.md
- apps/admin/README.md và feature README liên quan
- apps/web/README.md
- services/backend/README.md và README module auth/access/analytics/audit/admin
- README.md, docs/README.md, OpenAPI annotations/API tests

## 7. Cảnh báo xóa dữ liệu

Trước khi xóa production cần hiển thị và xác nhận đúng database/branch (không lộ credential), số account Seller, QR, grant, usage events và audit rows dự kiến bị ảnh hưởng. Không xóa mọi QR hoặc mọi usage events theo kiểu hàng loạt chỉ dựa vào seller_id, vì dữ liệu lịch sử có thể không gắn Seller. Hậu kiểm phải chứng minh QR Admin, grant User và audit không thuộc Seller vẫn còn nguyên.
