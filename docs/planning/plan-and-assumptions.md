# Kế hoạch, giả định và phiên bản (MVP)

## 1. Nguồn thiết kế đã đọc được

Bản Penpot được chia sẻ ("Cu Chi Tunnels Tourism Guide") đã được mở bằng trình duyệt và trích xuất nội dung chữ của 4 trang:

| Trang | Đã dùng cho |
|---|---|
| 01 — UX Structure | Phạm vi UC01–UC16, IA, luồng, danh sách màn hình M01–M11, các trạng thái UI |
| 02 — Design System | Màu (Earth Olive, Deep Forest, Earth Brown, Terracotta, Warm Sand, Old Paper, Charcoal, Stone Gray), font *Be Vietnam Pro*, spacing 4/8/12/16/20/24/32/40, nhãn nút/trạng thái tiếng Việt |
| 03 — High-Fidelity UI | Văn bản các trạng thái (đang tải, lỗi, offline, quyền vị trí…), bố cục thẻ bo góc nền kem |
| 04 — ADMIN / SUPER ADMIN | Sidebar tối màu nâu, bảng POI (tên, toạ độ, trạng thái Published/Unpublished, audio Ready/Processing/Failed) |

Mã màu là giá trị đọc từ SVG đã render (có thể lệch nhẹ so với token gốc):
`#4F5D3A` olive · `#293526` deep forest · `#795548` earth brown · `#A65F3B` terracotta · `#A94738` error · `#F3EACD` warm sand · `#FFF9EE` old paper · `#292824` charcoal · `#777268` stone gray.

**Nguồn nghiệp vụ hiện hành:** `docs/requirements/Use_Case_Specification_Final_15_UC.md` và `docs/requirements/BRD.md` (bản dự thảo v2.0, cập nhật 2026-10-20). Những giả định MVP cũ bên dưới không được ưu tiên hơn yêu cầu Seller/QR và website online-only mới.

## 2. Khác biệt giữa thiết kế và phạm vi MVP được giao (đã tự quyết)

| Điểm | Penpot / đặc tả | MVP này | Lý do |
|---|---|---|---|
| Truy cập User | Bản đặc tả cũ yêu cầu đăng nhập Tourist | QR dùng một lần kích hoạt quyền User có thời hạn; không có tài khoản Tourist | Quyết định nghiệp vụ 2026-10-20 |
| Thanh toán/Seller | Chưa có trong phạm vi cũ | Seller do Admin tạo; tiền mặt xác nhận thủ công, chuyển khoản xác minh tự động qua tích hợp | Chi tiết tích hợp TBD |
| Website online-only | Tài liệu cũ có offline pack | Không hỗ trợ offline map/data/audio hoặc tiếp tục dùng khi mất mạng | Quyết định nghiệp vụ 2026-10-20 |
| Auto Narration | Có trong đặc tả | Cần kiểm tra giới hạn Geolocation trên web và xác nhận ưu tiên | Chưa chốt thông số geofence |
| Admin UC11–UC16 (SSE, RBAC động, analytics, audit) | Có | Backlog; chỉ có 2 vai trò tĩnh `ADMIN`, `SUPER_ADMIN` | Prompt |
| Ngôn ngữ thứ 3 (日本語) | Có trong mockup | Chỉ `vi`, `en` (bảng `language` mở rộng được) | Dữ liệu mẫu |

## 3. Phiên bản đã chọn (kiểm tra ngày 2026-10-13)

Nguyên tắc: bản ổn định mới nhất phát hành trước ~2 tuần; ghi chính xác trong `package.json`/`pom.xml`, commit lockfile.

| Thành phần | Phiên bản | Nguồn kiểm tra |
|---|---|---|
| Java (JDK) | 21 LTS | Spring Boot 4.1 yêu cầu Java 17–26 |
| Spring Boot | 4.1.1 | spring.io/projects/spring-boot, docs system-requirements |
| springdoc-openapi | 3.1.1 (3.1.x nâng lên Boot 4.1) | springdoc.org, release notes v3.1.0 |
| Google Cloud libraries-bom | 26.84.0 | github.com/googleapis/java-cloud-bom/releases |
| Maven (wrapper) | 3.9.11 | phiên bản Maven trên máy kiểm tra |
| PostgreSQL | 16 | image `postgres:16-alpine` |
| React Native | 0.87.1 (CLI 20.2.0, template chính thức) | npm dist-tag `latest`; RN docs: Node ≥ 22.11, JDK 17 |
| Gradle (Android) | 9.4.1 (đi kèm template RN) | template |
| react-native-maps | 1.29.11 | npm |
| react-native-tts | 4.1.1 + patch Gradle (xem `apps/mobile/patches`) | npm (thư viện cũ, không còn bảo trì tích cực) |
| react-native-sound | 0.13.0 (có TurboModule) | npm |
| @op-engineering/op-sqlite | 18.2.5 | npm |
| @dr.pogodin/react-native-fs | 2.40.3 | npm |
| Admin | React 19.2.3, React Router 7.18.4, Vite 8.3.1, Tailwind CSS 4.3.3, Vitest 5.0.2, ESLint 10.11.0 | npm (exact versions + `package-lock.json`) |
| Mobile khác | React 19.2.3 (theo RN 0.87.1), React Navigation 7.4.x, react-native-screens 4.28.0, netinfo 12.0.1, react-native-config 1.7.2, patch-package 8.0.1 | npm |
| GitHub Actions | checkout v7.0.1, setup-java v6.0.1, setup-node v7.0.0, upload-artifact v7.0.1, setup-gradle v6.3.0, buildx v4.4.1, build-push v7.4.0 | trang Releases trên GitHub |
| Node.js | 22 LTS (≥ 22.11) | tài liệu RN: "Node 22.11.0 or newer" |
| JDK cho Android | 17 | tài liệu RN khuyến nghị JDK 17 |

## 4. Các bước đã thực hiện
1. Kiểm tra môi trường, đọc Penpot.
2. Backend: schema Flyway, API, bảo mật, TTS, lưu trữ, test.
3. Web admin.
4. Mobile.
5. CI/CD + tài liệu.
6. Chạy kiểm tra khả dụng — xem `docs/reports/verification-report.md`.

## 5. Giả định đã tự quyết (chi tiết nhỏ)

- User không có tài khoản Tourist; quyền truy cập được kích hoạt bằng QR dùng một lần do Seller cung cấp ngoài hệ thống trong MVP. UC12 không quản lý thanh toán/tạo QR nội bộ; Seller do Admin/Super Admin tạo tài khoản.
- Công khai POI yêu cầu nội dung tiếng Anh hợp lệ và audio tiếng Anh hiện hành khớp phiên bản nội dung.
- MVP chỉ bật `vi`/`en`; UI locale và audio locale độc lập, fallback hiển thị nhãn. Locale phải lấy từ bảng/cấu hình để có thể thêm ngôn ngữ mà không sửa logic lõi.
- UI locale và audio locale được chọn độc lập (chỉ `vi`/`en`).
- Mỗi POI hỗ trợ tối đa 6 ảnh có thứ tự và gallery.
- Audio upload: MP3/M4A/WAV/OGG ≤ 20 MB; ảnh JPEG/PNG/WEBP ≤ 5 MB; nhận dạng theo nội dung file.
- Phiên admin 8 giờ tuyệt đối, không gia hạn trượt.
- Một instance backend cho MVP (worker TTS vẫn an toàn khi nhiều instance nhờ `FOR UPDATE SKIP LOCKED`).
- Package Android `vn.edu.thuyetminh`, tên app `ThuyetMinh`.

## Quyết định demo đã chốt — 2026-10-20

- UC12 ngoài MVP; VNPAY Sandbox chỉ là lựa chọn tham khảo cho giai đoạn sau nếu được duyệt.
- UC12 ngoài MVP; mô hình gói phải mở rộng được. `DEMO_24H` (1 VND/24 giờ từ redeem thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau, không phải tính năng bán gói MVP.
- UC12 không triển khai trong MVP; phương thức thu tiền/cấp QR do Seller tự quyết định ngoài hệ thống. Chính sách hủy/hoàn tiền sẽ được chốt khi đưa UC12 vào phạm vi.
- QR dùng một lần; grant gắn với phiên trình duyệt/credential. Mọi API User phải kiểm tra grant ở backend.
- Chỉ `vi`/`en`, UI/audio locale độc lập, fallback có nhãn. Publish POI cần English content và audio hiện hành. Gallery tối đa 6 ảnh.
- RBAC chỉ `ADMIN`/`SUPER_ADMIN`; auto narration chỉ khi tab hoạt động và trình duyệt cho phép.
- Analytics/Audit/NFR theo BRD; ngưỡng định lượng là mục tiêu chưa đo kiểm.
- Seller/payment/QR, Analytics/Audit chỉ được coi là triển khai sau khi xác minh code, schema/migration, OpenAPI và test. Tài liệu không tự chứng minh tính năng đã chạy.
