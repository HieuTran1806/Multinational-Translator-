# Giai đoạn 1 — Hợp đồng nền tảng dùng chung

Trạng thái: **Bản dự thảo nền tảng, chờ cả ba thành viên rà soát.** Mã nguồn cũ chỉ là bằng chứng tham khảo; việc xây dựng lại phải tuân theo hợp đồng được thông qua trong tài liệu này và các yêu cầu được liên kết. Những quyết định nghiệp vụ chưa rõ phải được đưa ra thảo luận, không tự suy đoán.

## 1. Quy ước API

- Đường dẫn gốc: `/api/v1`.
- Phần thân yêu cầu/phản hồi JSON dùng `application/json`; endpoint tải tệp nhị phân phải khai báo rõ kiểu multipart.
- Quy tắc đặt tên trường: Dùng `camelCase` trong JSON; mã định danh ổn định không cần tiết lộ cấu trúc cho client, trừ khi ca sử dụng yêu cầu mã dễ đọc.
- Dấu thời gian: Phản hồi API dùng ISO-8601 UTC (`Z`). Lưu thời điểm và thời điểm kiểm toán theo UTC.
- Phân trang: thống nhất một cấu trúc dùng chung trước khi triển khai. Cấu trúc đề xuất: `{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }`; `page` bắt đầu từ 0.
- Việc sắp xếp và lọc danh sách phải được khai báo rõ, kiểm tra hợp lệ, có giá trị mặc định và kích thước trang tối đa được ghi tài liệu.
- Endpoint làm thay đổi dữ liệu phải kiểm tra quyền ở máy chủ, không dựa vào việc ẩn điều khiển trên giao diện.
- Dùng cơ chế chống xử lý lặp cho callback thanh toán và cấp QR ở những nơi việc thử lại có thể gây tác động trùng lặp.

## 2. Hợp đồng lỗi

Cấu trúc phản hồi chung đề xuất:

```json
{
  "code": "VALIDATION_FAILED",
  "status": 400,
  "message": "Dữ liệu yêu cầu không hợp lệ",
  "path": "/api/v1/example",
  "timestamp": "2026-01-01T00:00:00Z",
  "fieldErrors": [{ "field": "name", "message": "không được để trống" }]
}
```

Có thể bỏ `fieldErrors` khi không áp dụng. Không để lộ stack trace, bí mật, SQL nội bộ, token hoặc thông tin xác thực của nhà cung cấp.

- `400 VALIDATION_FAILED` — dữ liệu đầu vào sai định dạng hoặc không hợp lệ.
- `401 UNAUTHENTICATED` — thiếu thông tin xác thực, thông tin không hợp lệ, hết hạn hoặc đã bị thu hồi.
- `403 FORBIDDEN` — người dùng đã xác thực nhưng không có quyền hoặc vi phạm quy tắc tự quản lý được bảo vệ.
- `404 NOT_FOUND` — không tồn tại tài nguyên hoặc tài nguyên được che giấu theo chính sách truy cập.
- `409 CONFLICT` — xung đột chuyển trạng thái, tính duy nhất, khóa lạc quan, thanh toán/QR trùng lặp hoặc vòng đời tài nguyên.
- `413 PAYLOAD_TOO_LARGE` — tệp tải lên/yêu cầu vượt quá giới hạn cấu hình.
- `415 UNSUPPORTED_MEDIA` — kiểu nội dung không được hỗ trợ.
- `422 BUSINESS_RULE_VIOLATION` — yêu cầu đúng cú pháp nhưng không thể thực hiện theo quy tắc nghiệp vụ (dùng nhất quán, không tùy tiện trùng với mã 409).
- `429 RATE_LIMITED` — đã đạt giới hạn tần suất yêu cầu.
- `500 INTERNAL_ERROR` — lỗi ngoài dự kiến; kèm mã tương quan nhưng không tiết lộ thông tin nội bộ nhạy cảm.
- `503 DEPENDENCY_UNAVAILABLE` — dịch vụ phụ thuộc bắt buộc hiện không khả dụng.

Các trường phản hồi chung gồm `code`, `status`, `message`, `path` và `timestamp`; `fieldErrors` là tùy chọn. Mã lỗi là hợp đồng ổn định để máy xử lý. Nhóm phải quyết định lỗi quy tắc nghiệp vụ dùng 409 hay 422 trước khi triển khai; không được dùng hai mã thiếu nhất quán.

## 3. Nền tảng định danh và RBAC

- Mặc định từ chối quyền truy cập nếu chưa được cho phép; việc phân quyền phải được thực thi tại ranh giới API/dịch vụ.
- Các API đọc công khai dành cho User phải nằm trong danh sách cho phép rõ ràng; mọi endpoint khác đều cần xác thực và kiểm tra quyền.
- Chỉ Super Admin được tạo tài khoản Admin.
- Super Admin không được quản lý POI và không được tạo tài khoản Seller.
- Super Admin không được tự vô hiệu hóa, hạ vai trò, xóa hoặc làm mất quyền Super Admin của chính mình nếu việc đó khiến không còn Super Admin nào khác đang hoạt động. Chỉ cho phép thao tác khi sau giao dịch vẫn còn ít nhất một Super Admin khác đang hoạt động. Phải bảo đảm bằng giao dịch để tránh các yêu cầu đồng thời vô hiệu hóa hai Super Admin cuối cùng.
- Trả 401 khi thiếu thông tin xác thực hoặc xác thực không hợp lệ; trả 403 khi không đủ quyền hoặc vi phạm quy tắc tự thao tác được bảo vệ.
- Ghi nhật ký kiểm toán cho thao tác nhạy cảm về bảo mật: tác nhân, hành động, đối tượng, thời điểm, kết quả và mã tương quan/yêu cầu. Không bao giờ ghi thông tin xác thực, bearer token, bí mật thanh toán hoặc toàn bộ bí mật QR.
- Trước khi lập trình, xác định vai trò/quyền và quyền sở hữu tài nguyên trong ma trận đã được rà soát. Tên vai trò dưới đây chỉ là đề xuất: `SUPER_ADMIN`, `ADMIN`, `SELLER`, `USER`.

## 4. Nền tảng POI và đa phương tiện

- Vòng đời và khả năng hiển thị của POI phải được quy định rõ (ví dụ: nháp/đã xuất bản/đã lưu trữ, sau khi xác nhận các chuyển trạng thái được phép).
- Bản dịch thuộc về một POI và một ngôn ngữ; tài nguyên âm thanh phải gắn với đúng bản dịch/phiên bản nội dung.
- Quyền truy cập đa phương tiện phải dựa trên quyền sở hữu và chính sách hiển thị tài nguyên, không chỉ dựa vào ID có thể đoán được. Máy chủ phải kiểm tra loại tệp tải lên, kích thước, checksum, khóa lưu trữ và thứ tự.
- Phải đặc tả phiên bản manifest ngoại tuyến và cách xử lý nội dung lỗi thời. Không mặc định quyền truy cập đã tải xuống hoặc QR là token phân quyền nếu chưa được phê duyệt riêng.

## 5. Nền tảng Seller, thanh toán và QR

- Seller chỉ được cấp QR cho một User cụ thể sau khi kết quả thanh toán đáng tin cậy ở phía máy chủ xác nhận thành công.
- QR không được hết hạn trước khi được kích hoạt.
- QR phải gắn với một lần cấp/quyền truy cập duy nhất và có cơ chế chống phát lại. Thao tác quét/kích hoạt phải nguyên tử và có tính lặp an toàn.
- Không xem cờ “thanh toán thành công” do client gửi lên là bằng chứng có thẩm quyền.
- Các quyết định còn thiếu: nhà cung cấp thanh toán/xác minh webhook, xử lý hoàn tiền/chargeback, thanh toán trùng, hết hạn sau kích hoạt (nếu có), đổi/thu hồi QR, danh tính được phép kích hoạt và nội dung/dịch vụ mà QR cấp quyền.

## 6. Các miền API tối thiểu cần thống nhất

| Miền | Phạm vi tối thiểu cần đặc tả | Người phụ trách rà soát ban đầu |
|---|---|---|
| Ứng dụng User | Định danh/phiên User nếu cần; khám phá/xem chi tiết POI công khai; ngôn ngữ; đa phương tiện; manifest ngoại tuyến; quyền truy cập/kích hoạt QR | Người 1 |
| POI/đa phương tiện/Seller | Vòng đời POI; bản dịch; hình ảnh/âm thanh; định danh Seller; xác nhận thanh toán; cấp/cấp lại/thu hồi QR | Người 2 |
| RBAC/Admin/báo cáo | Xác thực Admin; vòng đời tài khoản; vai trò/quyền; nhật ký kiểm toán; báo cáo; quy tắc an toàn Super Admin | Người 3 |

## 7. Tiêu chí thông qua hợp đồng

- Mỗi ca sử dụng phải ánh xạ tới endpoint/thao tác, lược đồ yêu cầu/phản hồi, quyền và chuyển trạng thái.
- Mỗi endpoint được bảo vệ phải có quy tắc vai trò/quyền và sở hữu dữ liệu rõ ràng.
- Mỗi endpoint phải ghi rõ mã trạng thái thành công và thất bại.
- Không được cấp QR trước khi xác minh thanh toán thành công; không được phát lại thao tác kích hoạt; QR không hết hạn trước khi kích hoạt.
- Quy tắc giữ lại ít nhất một Super Admin khác đang hoạt động phải được thực thi nguyên tử và có kiểm thử.
- Các câu hỏi còn mở phải được ghi lại để quyết định, không được âm thầm triển khai dựa trên giả định.
