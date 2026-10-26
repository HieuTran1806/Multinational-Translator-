# Kế hoạch, giả định và phiên bản (MVP)

> **Cập nhật 2026-10-24:** các dòng phiên bản React Native/Gradle/react-native-* trong bảng dưới đây là lịch sử của `apps/mobile` — ứng dụng đã bị loại bỏ có chủ đích, dự án hiện web-only (xem `docs/development/mobile.md`).

## 1. Nguồn thiết kế đã đọc được

Bản Penpot được chia sẻ ("Cu Chi Tunnels Tourism Guide") đã được mở bằng trình duyệt và trích xuất nội dung chữ của 4 trang:

| Trang | Đã dùng cho |
|---|---|
| 01 — Cấu trúc trải nghiệm người dùng | Phạm vi UC01–UC16, IA, luồng, danh sách màn hình M01–M11, các trạng thái UI |
| 02 — Hệ thống thiết kế | Màu (Earth Olive, Deep Forest, Earth Brown, Terracotta, Warm Sand, Old Paper, Charcoal, Stone Gray), font *Be Vietnam Pro*, khoảng cách 4/8/12/16/20/24/32/40, nhãn nút/trạng thái tiếng Việt |
| 03 — Giao diện độ trung thực cao | Văn bản các trạng thái (đang tải, lỗi, ngoại tuyến, quyền vị trí…), bố cục thẻ bo góc nền kem |
| 04 — ADMIN / SUPER ADMIN | Thanh điều hướng bên màu nâu tối, bảng POI (tên, toạ độ, trạng thái Đã xuất bản/Chưa xuất bản, audio Sẵn sàng/Đang xử lý/Thất bại) |

Mã màu là giá trị đọc từ SVG đã render (có thể lệch nhẹ so với token gốc):
`#4F5D3A` xanh ô liu · `#293526` xanh rừng đậm · `#795548` nâu đất · `#A65F3B` đỏ đất nung · `#A94738` error · `#F3EACD` màu cát ấm · `#FFF9EE` màu giấy cũ · `#292824` xám than · `#777268` xám đá.

**Nguồn nghiệp vụ hiện hành:** `docs/requirements/Use_Case_Specification_Final_15_UC.md` và `docs/requirements/BRD.md` (bản dự thảo v2.0, cập nhật 2026-10-20). Những giả định MVP cũ bên dưới không được ưu tiên hơn yêu cầu Seller/QR và ứng dụng User React Native hoạt động chỉ hoạt động trực tuyến mới.

## 2. Khác biệt giữa thiết kế và phạm vi MVP được giao (đã tự quyết)

| Điểm | Penpot / đặc tả | MVP này | Lý do |
|---|---|---|---|
| Truy cập User | Bản đặc tả cũ yêu cầu đăng nhập Tourist | QR dùng một lần kích hoạt quyền User có thời hạn; không có tài khoản Tourist | Quyết định nghiệp vụ 2026-10-20 |
| Thanh toán/Seller | Chưa có trong phạm vi cũ | Seller chỉ do Admin tạo; Super Admin chỉ quản lý Admin. Quy trình thanh toán/QR thuộc UC12 ngoài MVP | Chi tiết tích hợp TBD |
| Ứng dụng User React Native chỉ hoạt động trực tuyến | Tài liệu cũ có ngoại tuyến pack | Không hỗ trợ ngoại tuyến map/data/audio hoặc tiếp tục dùng khi mất mạng | Quyết định nghiệp vụ 2026-10-20 |
| Thuyết minh tự động | Có trong đặc tả | Cần kiểm tra giới hạn định vị địa lý trên web và xác nhận ưu tiên | Chưa chốt thông số vùng địa lý |
| Admin UC11–UC16 (SSE, RBAC động, phân tích dữ liệu, kiểm toán) | Có | Danh sách công việc tồn đọng; chỉ có 2 vai trò tĩnh `ADMIN`, `SUPER_ADMIN` | Yêu cầu ban đầu |
| Ngôn ngữ thứ 3 (日本語) | Có trong mockup | Chỉ `vi`, `en` (bảng `language` mở rộng được) | Dữ liệu mẫu |

## 3. Phiên bản đã chọn (kiểm tra ngày 2026-10-13)

Nguyên tắc: bản ổn định mới nhất phát hành trước ~2 tuần; ghi chính xác trong `package.json`/`pom.xml`, commit lockfile.

| Thành phần | Phiên bản | Nguồn kiểm tra |
|---|---|---|
| Java (JDK) | 21 LTS | Spring Boot 4.1 yêu cầu Java 17–26 |
| Spring Boot | 4.1.1 | spring.io/projects/spring-boot, docs system-requirements |
| springdoc-openapi | 3.1.1 (3.1.x nâng lên Boot 4.1) | springdoc.org, ghi chú phát hành v3.1.0 |
| Google Cloud libraries-bom | 26.84.0 | github.com/googleapis/java-cloud-bom/releases |
| Maven (wrapper) | 3.9.11 | phiên bản Maven trên máy kiểm tra |
| PostgreSQL | 16 | image `postgres:16-alpine` |
| React Native | 0.87.1 (CLI 20.2.0, mẫu chính thức) | nhãn phân phối npm `mới nhất`; tài liệu React Native: Node ≥ 22.11, JDK 17 |
| Gradle (Android) | 9.4.1 (đi kèm mẫu RN) | mẫu |
| react-native-maps | 1.29.11 | npm |
| react-native-tts | 4.1.1 + patch Gradle (xem `apps/mobile/patches`) | npm (thư viện cũ, không còn bảo trì tích cực) |
| react-native-sound | 0.13.0 (có TurboModule) | npm |
| @op-engineering/op-sqlite | 18.2.5 | npm |
| @dr.pogodin/react-native-fs | 2.40.3 | npm |
| Admin | React 19.2.3, React Router 7.18.4, Vite 8.3.1, Tailwind CSS 4.3.3, Vitest 5.0.2, ESLint 10.11.0 | npm (phiên bản chính xác + `package-lock.json`) |
| Mobile khác | React 19.2.3 (theo RN 0.87.1), React Navigation 7.4.x, react-native-screens 4.28.0, netinfo 12.0.1, react-native-config 1.7.2, patch-package 8.0.1 | npm |
| GitHub Actions | checkout v7.0.1, setup-java v6.0.1, setup-node v7.0.0, upload-artifact v7.0.1, setup-gradle v6.3.0, buildx v4.4.1, build-push v7.4.0 | trang Releases trên GitHub |
| Node.js | 22 LTS (≥ 22.11) | tài liệu RN: "Node 22.11.0 or newer" |
| JDK cho Android | 17 | tài liệu RN khuyến nghị JDK 17 |

## 4. Các bước đã thực hiện
1. Kiểm tra môi trường, đọc tài liệu thiết kế Penpot.
2. Backend: schema Flyway, API, bảo mật, TTS, lưu trữ, kiểm thử.
3. Ứng dụng web Admin.
4. Ứng dụng di động.
5. CI/CD + tài liệu.
6. Chạy kiểm tra khả dụng — xem `docs/reports/verification-report.md`.

## 5. Giả định đã tự quyết (chi tiết nhỏ)

- User không có tài khoản Tourist; mỗi khách hàng có QR riêng, chỉ kích hoạt một lần; Seller tạo/cấp QR sau khi thanh toán thành công. UC12 không quản lý thanh toán/tạo QR nội bộ trong MVP; Seller chỉ do Admin tạo tài khoản.
- Công khai POI yêu cầu nội dung tiếng Anh hợp lệ và âm thanh tiếng Anh hiện hành khớp phiên bản nội dung.
- MVP chỉ bật `vi`/`en`; ngôn ngữ giao diện và ngôn ngữ âm thanh độc lập, phương án dự phòng hiển thị nhãn. Locale phải lấy từ bảng/cấu hình để có thể thêm ngôn ngữ mà không sửa logic lõi.
- ngôn ngữ giao diện và ngôn ngữ âm thanh được chọn độc lập (chỉ `vi`/`en`).
- Mỗi POI hỗ trợ tối đa 6 ảnh có thứ tự và thư viện ảnh.
- Tải âm thanh lên: MP3/M4A/WAV/OGG ≤ 20 MB; ảnh JPEG/PNG/WEBP ≤ 5 MB; nhận dạng theo nội dung tệp.
- Phiên admin 8 giờ tuyệt đối, không gia hạn trượt.
- Một instance backend cho MVP (worker TTS vẫn an toàn khi nhiều instance nhờ `FOR UPDATE SKIP LOCKED`).
- Package Android `vn.edu.thuyetminh`, tên app `ThuyetMinh`.

## Quyết định demo đã chốt — 2026-10-20

- UC12 ngoài MVP; VNPAY Sandbox chỉ là lựa chọn tham khảo cho giai đoạn sau nếu được duyệt.
- UC12 ngoài MVP; mô hình gói phải mở rộng được. `DEMO_24H` (1 VND/24 giờ kể từ lúc kích hoạt thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau, không phải tính năng bán gói MVP.
- UC12 không triển khai trong MVP; Seller tạo/cấp QR riêng cho từng khách hàng sau khi thanh toán thành công. Chính sách thu tiền/hủy/hoàn tiền sẽ được chốt khi đưa UC12 vào phạm vi.
- Mỗi khách hàng có QR riêng; QR chỉ kích hoạt một lần. Grant gắn với thiết bị đã kích hoạt, có hiệu lực 24 giờ từ kích hoạt thành công; ứng dụng có thể khôi phục phiên trên chính thiết bị đó sau khi đóng/mở lại, nhưng không hỗ trợ chuyển thiết bị hoặc khôi phục sang thiết bị khác.
- Chỉ `vi`/`en`, UI/ngôn ngữ âm thanh độc lập, phương án dự phòng có nhãn. Publish POI cần English content và audio hiện hành. Gallery tối đa 6 ảnh.
- RBAC có hai vai trò `ADMIN`/`SUPER_ADMIN`: Super Admin quản lý Admin/RBAC/Audit Log nhưng không quản lý POI/Seller; Admin quản lý POI và Seller. Super Admin không tự thao tác lên tài khoản mình; thay đổi do Super Admin khác thực hiện và sau thao tác phải còn ít nhất một Super Admin hoạt động. Auto narration tuân theo giới hạn nền tảng.
- Analytics/Audit/NFR theo BRD; ngưỡng định lượng là mục tiêu chưa đo kiểm.
- Seller/payment/QR, Analytics/Audit chỉ được coi là triển khai sau khi xác minh code, schema/migration, OpenAPI và kiểm thử. Tài liệu không tự chứng minh tính năng đã chạy.
