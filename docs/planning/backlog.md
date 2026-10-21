# Danh sách công việc tồn đọng (chưa triển khai trong MVP)

Không tạo nút hoặc màn hình giả cho các mục dưới đây.

## Theo đặc tả nghiệp vụ hiện hành nhưng chưa triển khai hoặc xác minh
- Xác thực QR dùng một lần, cấp quyền User có thời hạn và kiểm tra quyền ở backend.
- Quản lý giao dịch Seller; xác nhận tiền mặt và tích hợp xác minh chuyển khoản đáng tin cậy.
- Báo cáo Seller: doanh thu, giao dịch, mức sử dụng; bảo đảm chỉ xem dữ liệu của chính Seller.
- Quản lý tài khoản Seller do Admin tạo; Super Admin không có quyền tạo/quản lý Seller.
- UC06 Thuyết minh tự động theo vị trí: cần kiểm tra giới hạn định vị nền của React Native/hệ điều hành và chốt quy tắc geofence.
- Quản lý Admin/RBAC động, Analytics toàn hệ thống và Audit Log theo 15 UC hiện hành.
- Ứng dụng User React Native chỉ hoạt động trực tuyến; không phát triển tải/quản lý gói ngoại tuyến, bản đồ ngoại tuyến, POI ngoại tuyến hoặc âm thanh ngoại tuyến.
- M07 Trình xem hình ảnh (nhiều ảnh, băng chuyền tối đa 6 ảnh, lightbox) — chỉ triển khai nếu được ưu tiên/phê duyệt.
- Ngôn ngữ thứ 3 (日本語 trong mockup) và `trigger_radius`/`category` của POI cần đối chiếu phạm vi đã duyệt.

## Kỹ thuật
- Tự động dịch (Google TTS không dịch).
- TTS cho văn bản > 4500 byte: chia đoạn, ghép MP3.
- `MediaStorage` cho lưu trữ đối tượng (S3/GCS/R2) + URL ký tạm thời.
- Giới hạn tần suất đăng nhập / khoá tài khoản sau nhiều lần sai.
- Quản lý phiên: danh sách phiên, thu hồi tất cả.
- Đóng gói phông chữ *Be Vietnam Pro* trong ứng dụng di động.
- Bản địa hóa giao diện độc lập với ngôn ngữ thuyết minh (Penpot: "Ngôn ngữ âm thanh độc lập với ngôn ngữ giao diện").
- Tua/tìm vị trí và hiển thị thanh tiến trình âm thanh; phát nền và điều khiển trên màn hình khóa.
- Kiểm tra toàn vẹn định kỳ bằng SHA-256 (hiện chỉ kiểm tra SHA khi tải, kiểm tra nhanh size khi mở).
- Ghim GitHub Actions theo commit SHA; Dependabot/Renovate.
- Checksum (`distributionSha256Sum`) cho Maven Wrapper.
- Biên dịch/ký bản phát hành Android, biên dịch iOS và phát hành lên cửa hàng ứng dụng.
- Kiểm thử đầu cuối (Detox/Maestro cho ứng dụng di động, Playwright cho Admin).

## Tiêu chí nghiệm thu bản demo thanh toán/QR, Analytics và Audit

- UC12 ngoài MVP. Gói dịch vụ phải cấu hình/mở rộng được; `DEMO_24H` (1 VND, 24 giờ kể từ lúc kích hoạt thành công) chỉ là cấu hình demo tham khảo cho giai đoạn sau.
- UC12 ngoài MVP. VNPAY Sandbox chỉ là lựa chọn tham khảo cho giai đoạn sau; kiểm thử tích hợp nhà cung cấp không thuộc tiêu chí nghiệm thu MVP.
- Callback sai chữ ký/số tiền/mã tham chiếu, timeout hoặc trạng thái thất bại không cấp quyền; callback lặp không tạo giao dịch/QR/grant trùng.
- Hai yêu cầu kích hoạt cùng QR đồng thời chỉ có tối đa một yêu cầu thành công.
- Chỉ cho phép hủy trước khi kích hoạt QR; chưa hỗ trợ hoàn tiền sau kích hoạt. Giao dịch sai lệch phải được đưa vào trạng thái cần kiểm tra.
- Mọi API User yêu cầu grant ở backend; QR riêng cho từng khách hàng, một lần, quyền truy cập 24 giờ gắn với thiết bị. Seller chỉ đọc/sửa dữ liệu thuộc mình.
- Analytics cần định nghĩa công thức, nguồn, múi giờ, loại trùng lặp, độ trễ và quyền sở hữu dữ liệu trước nghiệm thu.
- Nhật ký kiểm toán phải ghi các sự kiện xác thực, nội dung/xuất bản/âm thanh, thanh toán, QR/grant, thay đổi tài khoản/role và cấu hình bảo mật; không chứa mật khẩu/token QR/thông tin xác thực ở dạng rõ.
- NFR mục tiêu: API P95 < 500 ms; redeem + grant P95 < 1 giây không tính hệ thống ngoài; trang User chính < 3 giây trong điều kiện kiểm thử được xác định; mục tiêu tham khảo khả dụng 99,5%/tháng, RPO ≤ 24h, RTO ≤ 8h nếu có sao lưu. Chỉ báo đạt khi có kết quả đo rõ ràng.
