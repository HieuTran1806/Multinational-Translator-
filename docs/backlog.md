# Backlog (chưa triển khai trong MVP)

Không có nút/màn hình giả cho các mục dưới đây.

## Theo đặc tả/Penpot nhưng ngoài phạm vi MVP
- UC01–UC03: Đăng ký, đăng nhập, đăng xuất cho khách (MVP giả định khách không cần tài khoản — **cần đối chiếu đặc tả**).
- Khôi phục mật khẩu.
- UC08 Thuyết minh tự động theo vị trí (geofence 30 m, GPS ≤ 15 m, debounce 3 s, một lần/POI/phiên; Penpot ghi chú mâu thuẫn "cooldown 5 phút" cần làm rõ). Không thu thập vị trí nền.
- Map Pack / bản đồ offline.
- M07 Image Viewer (nhiều ảnh, carousel tối đa 6 ảnh, lightbox) — MVP chỉ có 1 ảnh đại diện.
- UC11 Audio Task Monitoring nâng cao (SSE, tạm dừng/huỷ job), UC12 quản lý user, UC13 quản lý admin, UC14 RBAC động với ma trận permission, UC15 Analytics, UC16 Audit log.
- Ngôn ngữ thứ 3 (日本語 trong mockup) — chỉ cần thêm dòng vào bảng `language` và nội dung.
- `trigger_radius`, `category` của POI (có trong mockup admin).

## Kỹ thuật
- Tự động dịch (Google TTS không dịch).
- TTS cho văn bản > 4500 byte: chia đoạn, ghép MP3.
- `MediaStorage` cho object storage (S3/GCS/R2) + URL ký tạm thời.
- Giới hạn tần suất đăng nhập / khoá tài khoản sau nhiều lần sai.
- Quản lý phiên: danh sách phiên, thu hồi tất cả.
- Bundle font *Be Vietnam Pro* vào app mobile.
- i18n giao diện độc lập với ngôn ngữ thuyết minh (Penpot: "Audio language independent of UI language").
- Seek/thanh tiến trình cho audio; phát nền + điều khiển trên màn hình khoá.
- Kiểm tra toàn vẹn định kỳ bằng SHA-256 (hiện chỉ kiểm tra SHA khi tải, kiểm tra nhanh size khi mở).
- Ghim GitHub Actions theo commit SHA; Dependabot/Renovate.
- Checksum (`distributionSha256Sum`) cho Maven Wrapper.
- Build/ký Android release, iOS build, phát hành store.
- E2E test (Detox/Maestro cho mobile, Playwright cho admin).
