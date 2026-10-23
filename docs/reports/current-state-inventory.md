# Giai đoạn 1 — Kiểm kê hiện trạng (cập nhật sau khi khôi phục backend)

## Phạm vi và độ tin cậy

Bản kiểm kê này được lập từ triển khai trước trên nhánh `XuanHoai_UC01-03`, trước khi loại bỏ các thư mục triển khai khỏi `phase-1-contract-baseline`. Nhánh gốc vẫn được giữ lại. cây làm việc có 13 tệp tài liệu đã chỉnh sửa; các thay đổi đó được đưa vào stash (vùng lưu tạm Git) để dự phòng rồi áp dụng lại trên nhánh mới. Stash được cố ý giữ làm bản sao lưu bổ sung.

Bản kiểm kê dưới đây dựa trên việc kiểm tra tệp được Git theo dõi và tìm kiếm route/model trong mã nguồn, không dựa trên một lần chạy toàn bộ kiểm thử mới. Hãy xem tên route và trường dữ liệu là hành vi quan sát được từ hệ thống cũ, không phải hợp đồng đích đã được phê duyệt.

## Người 1 — Ứng dụng di động User

Đã quan sát:
- Ứng dụng di động React Native/TypeScript nằm trong `apps/mobile`.
- API client có hàm JSON chỉ dùng GET, timeout và chuẩn hóa lỗi mạng/HTTP.
- Client gọi các endpoint danh sách/chi tiết POI công khai, manifest ngoại tuyến và ngôn ngữ.
- DTO gồm tóm tắt/chi tiết POI, thuyết minh theo ngôn ngữ, metadata âm thanh và bản dịch ngoại tuyến.
- Đã có kiểm thử cho API client, thuyết minh, xử lý ngoại tuyến, phân giải nguồn đa phương tiện và chọn giọng đọc.

Khoảng trống / chưa tìm thấy bằng chứng trong client đã kiểm tra:
- Không tìm thấy hợp đồng đăng ký/đăng nhập/hồ sơ/phiên User trong các tệp API di động đã kiểm tra.
- Không tìm thấy luồng thanh toán, quyền mua, cấp QR hoặc kích hoạt QR trong các tệp API di động đã kiểm tra.
- Cần lập ma trận ánh xạ đầy đủ từ ca sử dụng sang màn hình và quy định rõ xung đột/lỗi ngoại tuyến trước khi triển khai.

## Người 2 — POI, đa phương tiện, Seller

Backend cũ đã quan sát:
- Các endpoint POI công khai: `GET /api/v1/public/pois`, `GET /api/v1/public/pois/{id}`, và `GET /api/v1/public/pois/{id}/offline-manifest`.
- Các endpoint POI dành cho Admin hỗ trợ CRUD, xuất bản/gỡ xuất bản, bản dịch, tải âm thanh, tải/xóa/sắp xếp hình ảnh.
- Endpoint đa phương tiện cung cấp âm thanh công khai/dành cho Admin và hình ảnh POI.
- Các thực thể dữ liệu gồm POI, bản dịch POI, hình ảnh POI, tài nguyên âm thanh và tác vụ TTS.

Khoảng trống:
- Không tìm thấy controller/model Seller, API thanh toán/đơn hàng, API cấp QR hoặc API kích hoạt QR trong danh mục backend cũ được Git theo dõi.
- Quy tắc nghiệp vụ đã thống nhất là Seller chỉ cấp QR riêng cho User sau khi thanh toán thành công; QR không được hết hạn trước khi kích hoạt. Cần quyết định rõ về hết hạn/thu hồi sau kích hoạt, cấp trùng, hoàn tiền/chargeback và chống phát lại.
- Cần xác định lại quyền truy cập và vòng đời lưu trữ đa phương tiện theo ma trận vai trò mới.

## Người 3 — RBAC, API Admin, báo cáo

Backend cũ đã quan sát:
- Auth endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Cấu hình bảo mật cho phép các endpoint health/info, đăng nhập và GET công khai; các quy tắc xác thực đã tồn tại cho `/api/v1/auth/**`. Có controller Admin, nhưng chú thích đường dẫn đã kiểm tra chưa chứng minh được có ma trận phân quyền theo vai trò đầy đủ.
- Mô hình lỗi API dùng chung có `code`, `message`, đường dẫn/ngữ cảnh và hỗ trợ lỗi theo trường; các trường phản hồi chính xác cần được thống nhất trong hợp đồng.
- API client của giao diện Admin hỗ trợ xác thực, POI, bản dịch, âm thanh, hình ảnh và thao tác TTS.

Các quy tắc bắt buộc đã thống nhất:
- Chỉ Super Admin được tạo tài khoản Admin.
- Super Admin không quản lý POI và không tạo tài khoản Seller.
- Phải chặn thao tác tự quản lý được bảo vệ nếu thao tác đó khiến không còn Super Admin nào khác đang hoạt động; phải luôn còn ít nhất một Super Admin khác hoạt động.

Khoảng trống:
- Không tìm thấy mô-đun API đã triển khai cho Seller, thanh toán/QR, báo cáo kiểm toán toàn diện hoặc ma trận thực thi RBAC đầy đủ trong mã nguồn đã kiểm tra.
- Cần phân biệt nhất quán lỗi chưa xác thực (401) với đã xác thực nhưng không được phép truy cập (403).

## Kết quả làm sạch kho mã (trước khi khôi phục backend)

Lúc đầu nhánh này loại bỏ các thư mục triển khai cũ và giữ lại tài liệu, workflow/cấu hình CI cùng các tệp hỗ trợ kho mã. Sau đó, chỉ `services/backend/` được khôi phục từ `XuanHoai_UC01-03`; các phần frontend, infra, design-system và scripts vẫn không được khôi phục. Kiểm thử backend hiện tại: `mvnw.cmd clean test` đạt 11/11 unit test. Integration tests (`*IT.java`) chưa được chạy trong bước này vì cần PostgreSQL.

## Trạng thái chuẩn hóa backend hiện tại

- Tách truy vấn Admin sang `PoiAdminQueryService`; tách thao tác ảnh/âm thanh POI sang `PoiMediaService`.
- Thêm hợp đồng `UploadedFile`; chỉ adapter web `MultipartUploadedFile` phụ thuộc `MultipartFile`, application services không còn nhận kiểu transport này.
- Ghi lại quy tắc kiến trúc tại `services/backend/ARCHITECTURE.md`.
- Đây là bước đầu, không phải tuyên bố đã hoàn tất Clean Architecture: service vẫn phụ thuộc Spring Data/JPA và Spring transaction.
