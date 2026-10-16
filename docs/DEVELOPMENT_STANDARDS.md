# Quy ước phát triển Multitional Translator

> **Mục đích:** Thống nhất các quy tắc về code, giao diện, API, bảo mật, kiểm thử và quy trình phối hợp để cả nhóm phát triển 16 Use Case theo cùng một chuẩn.
>
> **Nguồn chuẩn:** Tài liệu Use Case trong `docs/Use_Case_Specification_Final_16_UC.md` xác định phạm vi và hành vi nghiệp vụ. Penpot `02 — Design System` là nguồn tham chiếu thiết kế. Khi tài liệu chưa quyết định một chi tiết kỹ thuật, nhóm phải thống nhất và ghi lại trước khi triển khai; ví dụ trong tài liệu này không tự động trở thành quyết định về framework hay cấu hình thực tế.

## 1. Nguyên tắc chung

1. **Bám sát phạm vi 16 Use Case.** Không tự thêm tính năng, màn hình hoặc luồng nghiệp vụ ngoài đặc tả nếu chưa được thống nhất.
2. **Một nguồn sự thật cho mỗi loại quyết định:**
   - Phạm vi và hành vi: tài liệu Use Case.
   - Màu sắc, kiểu chữ, khoảng cách và thành phần UI: Penpot Design System.
   - API: tài liệu API và hợp đồng request/response đã thống nhất.
   - Quyết định kỹ thuật: tài liệu kiến trúc/quyết định của dự án.
3. **Ưu tiên KISS, DRY, SOLID và YAGNI** ở mức phù hợp; tránh trừu tượng hóa quá sớm hoặc tạo nhiều cách làm cho cùng một việc.
4. **Không đoán hợp đồng.** Nếu chưa rõ dữ liệu, quyền truy cập, trạng thái lỗi hoặc hành vi UI, hãy hỏi người phụ trách và cập nhật tài liệu trước khi code.
5. **Không phá vỡ phần đã tích hợp.** Thay đổi ảnh hưởng module khác phải được trao đổi, cập nhật hợp đồng và kiểm thử hồi quy.

## 2. Thống nhất nền tảng và công cụ

Trước khi phát triển song song, nhóm cần xác nhận và ghi vào tài liệu dự án:

- Ngôn ngữ, framework và phiên bản runtime.
- Cấu trúc frontend, backend và cách các phần giao tiếp.
- Router, quản lý state, thư viện form/validation, HTTP client và UI component.
- Cơ sở dữ liệu, migration và quy ước truy cập dữ liệu.
- Công cụ test, formatter, linter, type checker và package manager.
- Phiên bản công cụ cần thiết để chạy dự án tại máy mới.

**Quy tắc:** Dùng một package manager và commit lockfile tương ứng. Không thêm thư viện mới khi công cụ hiện có đáp ứng được yêu cầu mà không tạo gánh nặng đáng kể. Không tự nâng phiên bản framework hoặc thay kiến trúc mà chưa trao đổi với nhóm.

## 3. Quy tắc code và cấu trúc

### 3.1 Phân tách trách nhiệm

- **UI/Page/Screen:** hiển thị dữ liệu, nhận tương tác và điều phối luồng giao diện.
- **Component:** xử lý một phần giao diện có thể tái sử dụng; không chứa logic nghiệp vụ không cần thiết.
- **Service/Use case:** thực hiện logic nghiệp vụ.
- **API/client/repository:** tập trung giao tiếp với backend hoặc nguồn dữ liệu.
- **Validation/schema/type:** định nghĩa cấu trúc dữ liệu và quy tắc kiểm tra.
- **Shared utilities:** chỉ chứa hàm thực sự dùng chung, không gom mọi logic vào một thư mục tiện ích.

Ví dụ minh họa: `LoginPage` quản lý trải nghiệm đăng nhập; `AuthService` điều phối logic đăng nhập; `AuthApi` gọi endpoint. Điều chỉnh cách đặt tên theo stack thực tế của dự án.

### 3.2 Quy ước đặt tên

- Tên phải thể hiện mục đích và nhất quán trong toàn repo.
- Component/type/class: dùng quy ước phù hợp ngôn ngữ/framework, thường là `PascalCase`.
- Hàm/biến: thường là `camelCase`; hằng số theo quy ước thống nhất của repo.
- Tên file, thư mục, endpoint, biến môi trường và test phải theo một quy ước chung.
- Dùng tên miền nghiệp vụ nhất quán: `POI`, `Audio`, `Role`, `Permission`, `AuditLog`; không tạo nhiều tên khác nhau cho cùng khái niệm.

### 3.3 Chất lượng mã nguồn

- Tránh hàm/component quá lớn; tách khi việc đọc, kiểm thử hoặc tái sử dụng được cải thiện.
- Tránh lặp logic xác thực, xử lý lỗi, gọi API và kiểm tra quyền.
- Không nuốt lỗi bằng `catch` rỗng; xử lý hoặc chuyển tiếp lỗi có chủ đích.
- Hạn chế kiểu dữ liệu không an toàn như `any`; ưu tiên type/schema rõ ràng nếu stack hỗ trợ.
- Xóa code chết, import không dùng, debug log và TODO đã lỗi thời.
- Không commit file build, cache, secret hoặc file môi trường chứa thông tin nhạy cảm.
- Bình luận giải thích **lý do** hoặc ràng buộc khó thấy, không diễn giải lại từng dòng code.

## 4. Quy tắc giao diện và Design System

### 4.1 Nguồn thiết kế

- Dùng Penpot `02 — Design System` làm nguồn chuẩn cho token và component.
- Không tự đặt màu, font, radius, shadow hoặc khoảng cách mới nếu đã có token tương đương.
- Giá trị trong ví dụ code dưới đây chỉ minh họa cách tổ chức token, **không phải giá trị màu/kích thước chính thức** của dự án.
- Nếu thiết kế thiếu trạng thái hoặc có mâu thuẫn với Use Case, ghi nhận và thống nhất trước khi triển khai.

### 4.2 Token và component

Nhóm cần chuẩn hóa tối thiểu:

- Màu semantic: primary, background/surface, text, border, success, warning, error, disabled.
- Typography: font family, kích thước, weight, line height.
- Spacing theo thang thống nhất (ưu tiên bội số 4 nếu phù hợp với Design System).
- Border radius, shadow, icon set và breakpoint/responsive rules.
- Component dùng chung: Button, Input, Select, Modal/Dialog, Card, Toast/Alert, Loading, Empty State và Error State.

Ví dụ cấu trúc token (hãy thay bằng giá trị thật từ Penpot):

```css
:root {
  --color-primary: /* lấy từ Penpot */;
  --color-surface: /* lấy từ Penpot */;
  --color-text-primary: /* lấy từ Penpot */;
  --color-error: /* lấy từ Penpot */;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;

  --radius-control: /* lấy từ Penpot */;
  --radius-card: /* lấy từ Penpot */;
}
```

Mỗi component dùng chung phải có API và biến thể rõ ràng. Tránh tạo component riêng gần như giống hệt nhau nếu có thể cấu hình component chuẩn.

### 4.3 Trạng thái và hành vi UI

Với mỗi màn hình/luồng, xác định trạng thái cần thiết theo Use Case, có thể gồm:

- Initial/default.
- Loading hoặc submitting.
- Success.
- Empty/no data.
- Validation error.
- API/network error.
- Disabled hoặc không đủ quyền.
- Confirm/cancel cho thao tác phá hủy dữ liệu.
- Trạng thái đặc thù như audio processing/completed/failed, offline download/progress/failed và map permission/location unavailable.

Không cần tạo mọi trạng thái cho mọi màn hình một cách máy móc; chỉ thêm trạng thái có ý nghĩa đối với luồng đó. Trạng thái hiển thị phải phản ánh kết quả thực tế từ ứng dụng/backend.

### 4.4 Điều hướng và khả năng tiếp cận

- Điều hướng quay lại, tiêu đề và hành động chính phải nhất quán.
- Form phải có label, thông báo lỗi cụ thể và hướng dẫn cách khắc phục.
- Không dùng màu sắc làm tín hiệu duy nhất; kết hợp chữ, icon hoặc hình thức khác.
- Bảo đảm focus nhìn thấy được, thao tác bàn phím hợp lý, tên truy cập cho thành phần tương tác và độ tương phản phù hợp.
- Với giao diện mobile, hướng tới vùng chạm khoảng 44 × 44 px khi phù hợp với nền tảng.
- Không chặn người dùng vô thời hạn khi request lỗi; cung cấp cách thử lại hoặc quay lại an toàn.
- Ngăn gửi form lặp khi request đang xử lý; chỉ khóa thao tác khi thực sự cần thiết.

### 4.5 Ranh giới Tourist và Admin

- Tourist Mobile và Admin/Super Admin Web Dashboard là hai khu vực trải nghiệm khác nhau.
- Không đặt menu hoặc điều hướng Admin trong Tourist Mobile navigation.
- Màn hình/state board trên Penpot không mặc nhiên là một màn hình chức năng độc lập; chỉ tính là màn hình riêng khi có mục đích điều hướng hoặc tác vụ riêng.
- Không tự thêm tính năng ngoài đặc tả, chẳng hạn POI search/favorites hoặc Audit Log Detail, nếu chưa được phê duyệt.
- Màn hình Profile/Settings và vị trí đặt đổi ngôn ngữ/đăng xuất cần được nhóm xác nhận nhất quán với thiết kế và Use Case; không tự tạo luồng mới.

## 5. Quy ước frontend

Có thể tổ chức theo feature/module; cấu trúc chính xác phải phù hợp với repo hiện có. Ví dụ tham khảo:

```text
src/
  app/                 # khởi tạo ứng dụng, router, providers
  components/
    ui/                # component dùng chung
    layout/            # shell và navigation
  features/
    auth/
    language/
    map/
    poi/
    audio/
    offline/
    poi-management/
    audio-monitoring/
    users/
    admins/
    roles/
    analytics/
    audit-logs/
  services/            # lớp tích hợp dùng chung nếu phù hợp
  types/               # type/schema dùng chung nếu phù hợp
  utils/               # tiện ích thực sự dùng chung
```

- Đặt code gần feature sở hữu nó; chỉ đưa lên shared khi có nhu cầu dùng chung thực tế.
- Tách UI state, form state, server/API state và authentication state theo cách framework hỗ trợ.
- Không gọi API trực tiếp từ nhiều component theo các cách xử lý lỗi khác nhau; tập trung logic gọi API khi phù hợp.
- Không nhúng secret, private API key hoặc thông tin xác thực vào bundle frontend.
- Không coi việc ẩn nút trên UI là cơ chế bảo mật; backend phải kiểm tra quyền.

## 6. Hợp đồng API và dữ liệu

Trước khi hai người cùng triển khai frontend/backend cho một Use Case, thống nhất:

- Endpoint, HTTP method, path và versioning nếu có.
- Request/response schema, kiểu dữ liệu, field bắt buộc/tùy chọn và ví dụ.
- Cách biểu diễn lỗi và validation error.
- Cơ chế xác thực, phân quyền và hành vi khi phiên hết hạn.
- Pagination, filtering, sorting và định dạng ngày giờ/múi giờ.
- Quy tắc upload/download file hoặc audio, trạng thái xử lý bất đồng bộ và retry nếu có.
- Tương thích ngược và cách thay đổi hợp đồng.

Không để frontend và backend tự đoán schema độc lập. Khi hợp đồng thay đổi, cập nhật tài liệu và test liên quan trong cùng thay đổi.

### 6.1 Xử lý lỗi

Phân biệt tối thiểu:

- Lỗi dữ liệu đầu vào/validation.
- Chưa đăng nhập hoặc phiên hết hạn.
- Không đủ quyền.
- Không tìm thấy dữ liệu hoặc dữ liệu đã thay đổi.
- Xung đột nghiệp vụ.
- Lỗi mạng/timeout.
- Lỗi server hoặc dịch vụ bên ngoài.

Thông báo cho người dùng phải dễ hiểu, không lộ stack trace, SQL, token hay chi tiết nội bộ. Log kỹ thuật cần đủ thông tin để chẩn đoán nhưng phải loại bỏ dữ liệu nhạy cảm.

### 6.2 Trạng thái bất đồng bộ

Các luồng audio, offline và analytics cần quy định rõ trạng thái hợp lệ, chuyển trạng thái, retry/cancel nếu được hỗ trợ và cách UI cập nhật. Không tự suy diễn rằng một tác vụ đã hoàn tất nếu backend chưa xác nhận.

## 7. Bảo mật, tài khoản và phân quyền

- Backend là nơi thực thi quyền truy cập có thẩm quyền; mọi endpoint nhạy cảm phải kiểm tra quyền ở server.
- Áp dụng RBAC theo UC14; UI chỉ hỗ trợ trải nghiệm và không thay thế kiểm tra quyền phía backend.
- Phân biệt rõ UC12 (quản lý tài khoản người dùng) và UC13 (quản lý tài khoản Admin).
- Quy trình tạo Admin, vai trò mặc định và quyền có hiệu lực phải theo Use Case/đặc tả đã thống nhất; không tự gán thêm quyền.
- Kiểm tra dữ liệu ở cả frontend (trải nghiệm) và backend (bảo vệ dữ liệu).
- Không log mật khẩu, token, secret hoặc dữ liệu cá nhân không cần thiết.
- Không lưu secret trong source control; dùng biến môi trường và cung cấp file mẫu không chứa giá trị bí mật.
- Thao tác nhạy cảm hoặc phá hủy phải xác nhận phù hợp và kiểm tra quyền ở backend.
- Audit Log phải được ghi nhận ở backend cho những hành động thuộc phạm vi yêu cầu; không dựa vào log frontend làm bằng chứng kiểm toán.
- Không tự thêm chức năng Audit Log Detail/export nếu không nằm trong phạm vi đã duyệt.

## 8. Git và phối hợp nhóm

### 8.1 Nhánh và commit

- Giữ nhánh tích hợp chính `main` (hoặc tên nhánh chính thức hiện có của repo).
- Dùng nhánh ngắn hạn theo feature/bug, ví dụ:
  - `feature/auth-login`
  - `feature/poi-detail`
  - `fix/audio-playback-error`
- Commit nhỏ, tập trung vào một mục tiêu; tránh gom nhiều Use Case không liên quan vào một commit.
- Không commit secret, log, cache, file build hoặc thay đổi định dạng toàn repo không liên quan.
- Không force-push hoặc ghi đè thay đổi của người khác nếu chưa trao đổi.

Có thể dùng Conventional Commits nếu nhóm thống nhất:

```text
feat(auth): implement login validation
feat(poi): add POI detail view
fix(audio): handle playback failure
test(roles): cover permission checks
refactor(api): centralize error handling
docs(setup): update development instructions
```

### 8.2 Pull request và tích hợp

- PR cần mô tả mục đích, Use Case liên quan, thay đổi chính, cách kiểm thử và ảnh chụp màn hình nếu thay đổi UI.
- Ít nhất một thành viên khác review trước khi merge, trừ khi quy trình nhóm quy định khác.
- Chạy các kiểm tra phù hợp trước khi merge.
- Giải quyết conflict bằng cách hiểu thay đổi ở cả hai phía; không xóa code của người khác chỉ để làm conflict biến mất.
- Thống nhất chủ sở hữu file dùng chung như router, API client, Design System và cấu hình build để giảm conflict.
- Sau khi merge, xác nhận luồng tích hợp hoạt động; không coi “merge thành công” là bằng chứng tính năng hoàn chỉnh.

## 9. Kiểm thử và Definition of Done

### 9.1 Các lớp kiểm thử

Tùy stack, ưu tiên:

1. **Unit test:** logic nghiệp vụ, validation, utility và chuyển trạng thái.
2. **Component test:** hành vi component, form, loading/error và tương tác.
3. **Integration test:** API, database, auth và permission.
4. **End-to-end test:** các luồng quan trọng từ đầu đến cuối.
5. **Regression test:** bảo đảm thay đổi không làm hỏng chức năng hiện có.
6. **Accessibility check:** bàn phím, focus, label, contrast và thông báo lỗi.

Các luồng E2E tối thiểu cần cân nhắc dựa trên đặc tả:

- Tourist: đăng ký/đăng nhập, chọn ngôn ngữ, khám phá bản đồ, mở chi tiết POI, phát audio, quản lý dữ liệu offline.
- Admin: đăng nhập, quản lý POI, theo dõi tiến độ audio, quản lý User/Admin, quản lý Role/Permission, xem Analytics và Audit Log.
- Phân quyền: kiểm tra cả trường hợp được phép và bị từ chối ở backend.

### 9.2 Checklist Definition of Done

Một thay đổi chỉ được coi là hoàn tất khi các mục phù hợp đều đạt:

- [ ] Đúng phạm vi và tiêu chí chấp nhận của Use Case.
- [ ] UI tuân thủ Penpot Design System và điều hướng đã thống nhất.
- [ ] Có các trạng thái cần thiết (loading, empty, error, success và trạng thái đặc thù).
- [ ] Request/response và xử lý lỗi khớp hợp đồng API.
- [ ] Kiểm tra quyền đúng ở backend khi có liên quan.
- [ ] Có test phù hợp; test liên quan đã chạy thành công.
- [ ] Formatter/linter/type-check (nếu có) không còn lỗi mới.
- [ ] Không đưa secret hoặc dữ liệu nhạy cảm vào repo/log.
- [ ] Có review từ thành viên khác theo quy trình nhóm.
- [ ] Tài liệu, ví dụ cấu hình hoặc hướng dẫn chạy được cập nhật khi cần.
- [ ] Thay đổi đã tích hợp và luồng liên quan được xác minh.

## 10. Phân chia công việc cho 3 người

Phân chia theo module để giảm việc nhiều người sửa cùng file; đây là gợi ý ban đầu và có thể điều chỉnh theo năng lực/thực trạng repo.

| Người phụ trách | Phạm vi gợi ý | Use Case |
|---|---|---|
| Người 1 — Auth & Accounts | Đăng ký/đăng nhập/đăng xuất, chọn ngôn ngữ; quản lý User và Admin | UC01–UC04, UC12–UC13 |
| Người 2 — Tourist Experience & Content | Bản đồ, chi tiết POI, audio; quản lý POI và giám sát audio | UC05–UC07, UC10–UC11 |
| Người 3 — Offline, RBAC & Insights | Thuyết minh tự động, offline; Role/Permission, Analytics, Audit Log | UC08–UC09, UC14–UC16 |

Quy tắc phối hợp:

- Cùng thống nhất router, layout, Design System, API contract, error format và type dùng chung trước khi chia nhánh.
- Thay đổi ở module dùng chung cần thông báo cho các thành viên liên quan.
- Chủ sở hữu module chịu trách nhiệm test và tài liệu cho module đó; cả nhóm cùng chịu trách nhiệm tích hợp.
- UC12 và UC13 cần phối hợp với UC14 để bảo đảm quản lý tài khoản không làm lệch mô hình phân quyền.

## 11. Các quyết định cần chốt trước khi triển khai rộng

Đánh dấu hoàn tất trong buổi thống nhất nhóm và ghi quyết định vào tài liệu tương ứng:

- [ ] Framework, phiên bản runtime và package manager chính thức.
- [ ] Cấu trúc frontend/backend và cách chạy local.
- [ ] Router, state management, form/validation và HTTP client.
- [ ] Quy ước API, lỗi, pagination/filter/sort và ngày giờ.
- [ ] Token/component lấy từ Penpot và cách triển khai thành code.
- [ ] Vị trí đổi ngôn ngữ/đăng xuất và phạm vi màn hình Profile/Settings.
- [ ] Quy tắc nhánh, commit, review và kiểm tra bắt buộc trước merge.
- [ ] Bộ test tối thiểu cho từng Use Case và Definition of Done.
- [ ] Quy trình cập nhật tài liệu khi thay đổi quyết định hoặc hợp đồng.

**Nguyên tắc cuối cùng:** Nếu quy tắc trong tài liệu này mâu thuẫn với Use Case đã được phê duyệt hoặc cấu hình thực tế của repository, không tự ý sửa theo phỏng đoán. Hãy nêu rõ mâu thuẫn, thống nhất quyết định mới và cập nhật tài liệu nguồn trước khi triển khai.
