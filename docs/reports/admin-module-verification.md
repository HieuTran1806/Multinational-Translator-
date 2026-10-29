# Current verification addendum — 2026-10-29

The role/feature descriptions in the historical report below are superseded by this current matrix: Admin manages POI, translations, media, QR and system Analytics; Super Admin manages Admin accounts and reads Audit Log; Seller and Seller reports are removed. The Admin Accounts page now fixes created account role to ADMIN, lists only Admin accounts, supports details and soft deletion, and does not edit roles. Production Flyway V6 is applied; backend unit tests (60), Admin tests (56), lint and build passed; Web User tests (73), lint (3 warnings/0 errors) and build passed. Production has one active Admin and zero Super Admins, so privileged production UI/API flows cannot be operationally exercised until an approved Super Admin bootstrap is performed.

---

## Historical baseline — 2026-10-21 (not current role requirements)
# Báo cáo nghiệm thu — Admin module (UC07 + UC08 một phần)

Ngày kiểm chứng: 2026-10-21. Các kiểm thử được thực hiện trên cây làm việc bắt đầu từ nhánh `phase-1-contract-baseline`; báo cáo được bổ sung vào nhánh `feat(admin)` (HEAD trước commit: `7273c9a`).

## 1. Quyết định nền

- Nhánh `phase-1-contract-baseline` chỉ có backend đã chuẩn hóa; toàn bộ mã frontend nằm trên nhánh gốc `XuanHoai_UC01-03`.
- Đã **khôi phục `apps/admin/` và `design-system/` từ `XuanHoai_UC01-03` vào cây làm việc** của nhánh hiện tại (không đổi nhánh, không đụng backend đang chuẩn hóa), rồi hoàn thiện trên nền backend mới.
- Không xoá, không revert thay đổi có sẵn. `infra/` vốn đang untracked trong cây làm việc và được giữ nguyên.

## 2. Truy vết Use Case → màn hình → API → kiểm thử

| Use Case | Chức năng | Màn hình / thành phần | API | Kiểm thử |
|---|---|---|---|---|
| UC07 bước 1–2 | Vào khu quản lý, xem danh sách có tìm kiếm/lọc/phân trang | `/pois` — `PoiListPage`, `Pagination` | `GET /api/v1/admin/pois?page&size&status&q` | `PoiListPage.test.jsx`, E2E "list/filters/paging" |
| UC07 bước 3, A1 | Tạo POI (nháp) | `/pois/new` — `PoiEditPage` + `poiForm.js` | `POST /api/v1/admin/pois` | `poiForm` test, E2E create + đọc lại |
| UC07 bước 3 | Xem chi tiết & sửa | `/pois/:id` | `GET/PUT /api/v1/admin/pois/{id}` (+`rowVersion`) | `PoiAdminServiceTest`, E2E update + 409 xung đột |
| UC07 bước 4 | Nhập nội dung theo ngôn ngữ | tab ngôn ngữ — `TranslationEditor` | `PUT /api/v1/admin/pois/{id}/translations/{lang}` | E2E vi/en, `PoiTranslationTest` |
| UC07 A2 | Quản lý ảnh | khối "Ảnh POI" trong `PoiEditPage` | `POST /pois/{id}/image`, `DELETE /pois/{id}/images/{imageId}`, `PUT /pois/{id}/images/order` | `PoiMediaServiceTest`, E2E upload/đọc lại bytes/415 |
| UC07 A2 | Quản lý audio + TTS | `AudioPanel`, `useJobPolling` | `POST /pois/{id}/translations/{lang}/audio`, `POST .../tts`, `GET /admin/tts/jobs/{id}` | `AudioPanel.test.jsx`, `TtsIT`, E2E upload audio |
| UC07 A3 | Công khai POI theo readiness | nút Công khai / Chuyển về nháp | `POST /pois/{id}/publish`, `/unpublish` | `PoiFlowIT`, E2E publish/unpublish |
| UC07 E1 | Dữ liệu không hợp lệ | lỗi theo trường trên form | 400 `VALIDATION_FAILED` + `fieldErrors` | E2E validation, `SecurityIT` |
| UC07 E2 | Ghi đè đồng thời | `rowVersion` gửi kèm | 409 `CONFLICT` | E2E stale rowVersion |
| UC07 E4 | Không đủ quyền | `RequirePoiAdmin`, ẩn nav | 403 `FORBIDDEN` | `App.test.jsx`, `SecurityIT.superAdminCannotManagePoiContent`, E2E |
| UC04/UC05 (User web) | Dữ liệu Admin lưu phải đọc được bởi app User | — | `GET /public/pois`, `/public/pois/{id}?lang`, `/public/audio/{id}`, `/public/pois/{id}/image`, `/offline-manifest` | E2E: tên/nội dung/audio/ảnh/fallback/manifest |

## 3. Thay đổi chính

Backend (`services/backend`):
- `auth/SecurityConfig.java`: `/api/v1/admin/**` chỉ cho `ADMIN` — Super Admin không quản lý POI (UC07 actor = Admin, UC10 = Super Admin), trước đây Super Admin vẫn vào được.
- `it/SecurityIT.java`: thêm test phân quyền Super Admin (403) và xác nhận ADMIN vẫn dùng được.

Frontend (`apps/admin`):
- `auth/AuthContext.jsx`, `api/client.js`: token đọc trực tiếp từ session đã lưu. **Sửa lỗi thực tế**: trước đây cấu hình token nằm trong `useEffect` của provider, nên request phát ra từ effect của component con ở lần render đầu **không có** header `Authorization` (dev che lỗi nhờ StrictMode mount 2 lần; production sẽ 401 ngay khi mở trang). Có test hồi quy `auth/AuthContext.test.jsx`.
- `App.jsx`, `components/Layout.jsx`: guard theo vai trò, shell mới theo Figma (sidebar trắng + topbar breadcrumb + nút "+ Thêm POI mới").
- `pages/PoiListPage.jsx`, `pages/PoiEditPage.jsx`: bỏ hardcode nhãn/ngôn ngữ (`vi`/`en`), ngôn ngữ hoạt động lấy từ API; bỏ nút "Thêm POI" trùng với topbar.
- `design-system/tokens.json` + `theme-tokens.css`: thay token sidebar tối bằng token shell của Figma (`shell`, `shellBorder`, `navActive`, `muted`).
- `scripts/verify-e2e.mjs` + `npm run verify:e2e`: kịch bản kiểm chứng đầu cuối lặp lại được.

## 4. Đối chiếu Figma

Figma MCP: file `Cu Chi Tunnels`, trang **MT - Admin Portal** (frame `6:229` Dashboard & POI, `11:3313` UC07b, `12:574` Media, `12:1448` Translations).

Đã áp dụng: bố cục sidebar 248px nền trắng + topbar 68px + vùng nội dung nền `#F7F7F2`; logo mark "MT"; nhãn nhóm "QUẢN TRỊ"; nav item active nền `#EEF3E9` + icon + chữ olive; thẻ người dùng ở chân sidebar; breadcrumb `Admin / …`; nút "+ Thêm POI mới" trên topbar; tiêu đề trang 26px; badge trạng thái.

Chưa áp dụng (và lý do):

| Hạng mục trong Figma | Lý do không triển khai |
|---|---|
| Dashboard thống kê (Tổng POI, Bản dịch cần sửa, Media, Audio/TTS) | Không có API tổng hợp; UC14/UC08 ngoài phạm vi MVP |
| Menu Translations / Images & Media / Audio/TTS / Reports / Settings tách riêng | Backend chỉ có endpoint theo POI (không có danh sách media/bản dịch toàn hệ thống); UC07 gom về một luồng POI |
| Xuất CSV (Ready/Exporting/Error/Success) | Không có endpoint và không thuộc UC07 |
| Content Approval (hàng chờ rà soát, modal duyệt) | Không có trạng thái/quy trình duyệt trong schema; UC07 chỉ có nháp/công khai |
| Ngôn ngữ JA/KO/ZH (`*` = chưa có) | `language` table hiện chỉ seed `vi`,`en`; UI lấy danh sách từ API nên tự hiện khi backend bổ sung |
| Trường "Mô tả", "Ngôn ngữ gốc", "Khu vực/địa chỉ" ở cấp POI | Không có trong entity `Poi`; mô tả thuộc bản dịch, thêm cột sẽ đổi contract/dữ liệu ngoài phạm vi |
| Modal tạo POI, panel bộ lọc nâng cao (loại POI, khoảng ngày) | Backend chỉ lọc theo `status` + `q`; không có enum loại POI (category là chuỗi tự do) |
| Ô tìm kiếm toàn cục trên topbar, chuông thông báo, đổi ngôn ngữ UI | Không có API/nghiệp vụ tương ứng — không dựng nút giả |

## 5. Kết quả kiểm thử (đã chạy thật)

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| `npm run lint` (admin) | PASS | không lỗi |
| `npm test` (admin) | PASS | 8 file, 28 test |
| `npm run build` (admin) | PASS | bundle 265.84 kB; `dist` **không** chứa chunk mock |
| `./mvnw test` (backend) | PASS | 34 unit test |
| `./mvnw verify` (backend + PostgreSQL) | PASS ở lượt kiểm chứng ban đầu; lần chạy lại trước commit bị chặn | 23 integration test đã PASS ở lượt trước. Lần chạy lại: 34 unit test PASS, nhưng PostgreSQL local từ chối xác thực user `thuyetminh` (SQLState 28P01), nên không xác nhận lại được integration tests trong lượt này. |
| `npm run verify:e2e` (API thật, DB `thuyetminh_e2e`) | PASS | 60/60 kiểm tra |
| UI thật trên trình duyệt headless (Edge + CDP, dev server + backend 18081) | PASS | đăng nhập bị chặn khi chưa có session; danh sách/sửa/tạo render dữ liệu thật; 0 request lỗi, 0 exception |
| Persistence sau ghi | PASS | E2E đọc lại POI, bản dịch, ảnh/audio (so sánh bytes), manifest |
| User web compatibility | PASS | `GET /public/pois`, `/pois/{id}?lang`, `/public/audio/{id}`, ảnh, manifest trả đúng nội dung đã lưu; POI nháp/gỡ công khai trả 404 |
| Authorization | PASS | 401 khi không token; 403 với Super Admin; `SecurityIT` |

Môi trường: Java 25 (mã nguồn target 21), Maven Wrapper 3.9.11, Node 24.21, PostgreSQL 16 (Docker), Edge 155 headless.

## 6. Giới hạn / chưa xác minh

- E2E dùng PostgreSQL local + storage local (`./target/e2e-media`), không phải môi trường staging/production.
- Không có Google Cloud TTS credential: luồng TTS chỉ kiểm bằng provider `none` (đã có `TtsIT` với provider giả) — chưa xác minh tạo audio thật từ Google.
- Chưa kiểm thử trên thiết bị di động thật; tương thích User web được xác minh ở mức contract API public (đối chiếu `apps/mobile/src/api/types.ts` trên nhánh gốc).
- Chưa có E2E trình duyệt tự động trong CI (script CDP chỉ dùng một lần để kiểm chứng thủ công).
- Trước khi commit, đã chạy lại `npm run lint`, `npm test` (8 file/28 test) và `npm run build`: đều PASS. `./mvnw verify` chạy lại không hoàn tất do thông tin xác thực PostgreSQL local không khớp; không thay đổi mật khẩu, cấu hình hoặc dữ liệu DB.
- Các màn hình Figma ngoài phạm vi backend ở mục 4 vẫn chưa có.
