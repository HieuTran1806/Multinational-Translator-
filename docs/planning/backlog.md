# Backlog (chưa triển khai trong MVP)

Không có nút/màn hình giả cho các mục dưới đây.

## Theo đặc tả nghiệp vụ hiện hành nhưng chưa triển khai/xác minh
- Xác thực QR dùng một lần, cấp quyền User có thời hạn và kiểm tra quyền ở backend.
- Quản lý giao dịch Seller; xác nhận tiền mặt và tích hợp xác minh chuyển khoản đáng tin cậy.
- Báo cáo Seller: doanh thu, giao dịch, usage; bảo đảm chỉ xem dữ liệu của chính Seller.
- Quản lý tài khoản Seller do Admin/Super Admin tạo.
- UC06 Thuyết minh tự động theo vị trí: cần kiểm tra giới hạn Geolocation của trình duyệt web và chốt quy tắc geofence.
- Quản lý Admin/RBAC động, Analytics toàn hệ thống và Audit Log theo 15 UC hiện hành.
- Các chức năng web phụ thuộc mạng; không phát triển tải/quản lý gói offline, offline map, offline POI hoặc offline audio.
- M07 Image Viewer (nhiều ảnh, carousel tối đa 6 ảnh, lightbox) — chỉ triển khai nếu được ưu tiên/phê duyệt.
- Ngôn ngữ thứ 3 (日本語 trong mockup) và `trigger_radius`/`category` của POI cần đối chiếu phạm vi đã duyệt.

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

## Định nghĩa nghiệm thu demo thanh toán/QR, Analytics và Audit

- UC12 ngoài MVP. Gói dịch vụ phải cấu hình/mở rộng được; `DEMO_24H` (1 VND, 24 giờ từ redeem thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau.
- UC12 ngoài MVP. VNPAY Sandbox chỉ là lựa chọn tham khảo cho giai đoạn sau; không kiểm thử tích hợp nhà cung cấp như tiêu chí MVP.
- Callback sai chữ ký/số tiền/mã tham chiếu, timeout hoặc trạng thái thất bại không cấp quyền; callback lặp không tạo giao dịch/QR/grant trùng.
- Hai yêu cầu redeem cùng QR đồng thời chỉ có tối đa một yêu cầu thành công.
- Hủy chỉ trước redeem; chưa hỗ trợ hoàn tiền sau kích hoạt. Giao dịch sai lệch phải được đưa vào trạng thái cần kiểm tra.
- Mọi API User yêu cầu grant ở backend; Seller chỉ đọc/sửa giao dịch thuộc mình.
- Analytics cần định nghĩa công thức, nguồn, timezone, deduplication, độ trễ và ownership trước nghiệm thu.
- Audit phải ghi các sự kiện xác thực, nội dung/publish/audio, thanh toán, QR/grant, thay đổi tài khoản/role và cấu hình bảo mật; không chứa password/token QR/credential dạng rõ.
- NFR mục tiêu: API P95 < 500 ms; redeem + grant P95 < 1 giây không tính hệ thống ngoài; trang User chính < 3 giây trong điều kiện test được xác định; mục tiêu tham khảo khả dụng 99,5%/tháng, RPO ≤ 24h, RTO ≤ 8h nếu có backup. Chỉ báo đạt khi có kết quả đo rõ ràng.
