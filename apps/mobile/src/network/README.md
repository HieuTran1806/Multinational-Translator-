# Mobile Network

Chứa tiện ích trạng thái kết nối, kiểm tra online/offline và logic liên quan khả năng truy cập mạng.

Không trùng lặp HTTP client của `api/`. Trạng thái kết nối chỉ là tín hiệu kỹ thuật; lỗi request thực tế vẫn phải được xử lý riêng. Tích hợp với offline flow mà không tuyên bố dữ liệu đã đồng bộ khi chưa xác nhận.
