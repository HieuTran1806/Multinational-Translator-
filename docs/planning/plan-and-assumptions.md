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

**Chưa đọc được**: file đặc tả `Use_Case_Specification_Final_16_UC.md` (chỉ thấy tên file được nhắc trong Penpot). Mọi nghiệp vụ dưới đây lấy từ yêu cầu của nhóm + phần chữ trong Penpot.

## 2. Khác biệt giữa thiết kế và phạm vi MVP được giao (đã tự quyết)

| Điểm | Penpot / đặc tả | MVP này | Lý do |
|---|---|---|---|
| Đăng nhập khách (UC01–UC03) | Tourist phải đăng ký/đăng nhập | **Khách xem/nghe không cần đăng nhập** | Theo yêu cầu prompt; *cần đối chiếu đặc tả* |
| Tab danh sách POI | Penpot ghi "POI List = Not specified" | Có màn hình Danh sách | Prompt yêu cầu danh sách + truy cập offline khi không có bản đồ |
| Map Pack offline | Có | Không | Prompt: không tuyên bố Maps offline |
| Auto Narration (UC08) | P0 | Backlog | Prompt loại khỏi MVP |
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

- Khách không cần đăng nhập (cần đối chiếu đặc tả UC01–UC03).
- Công khai POI yêu cầu ≥ 1 ngôn ngữ có nội dung; audio không bắt buộc (mobile có giọng thiết bị dự phòng).
- Thiếu ngôn ngữ yêu cầu → hiển thị ngôn ngữ khác kèm thông báo (theo state "Fallback locale" trong Penpot).
- Ngôn ngữ giao diện mobile đi theo ngôn ngữ thuyết minh (vi/en); tách riêng nằm trong backlog.
- Một ảnh đại diện/POI; carousel 6 ảnh nằm trong backlog.
- Audio upload: MP3/M4A/WAV/OGG ≤ 20 MB; ảnh JPEG/PNG/WEBP ≤ 5 MB; nhận dạng theo nội dung file.
- Phiên admin 8 giờ tuyệt đối, không gia hạn trượt.
- Một instance backend cho MVP (worker TTS vẫn an toàn khi nhiều instance nhờ `FOR UPDATE SKIP LOCKED`).
- Package Android `vn.edu.thuyetminh`, tên app `ThuyetMinh`.
