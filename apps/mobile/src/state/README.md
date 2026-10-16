# Mobile State

Chứa state dùng chung qua nhiều màn hình, chẳng hạn session, ngôn ngữ đang chọn hoặc trạng thái điều phối audio nếu thật sự cần chia sẻ.

Không dùng state toàn cục cho dữ liệu chỉ cần ở một component. Làm rõ nguồn dữ liệu chuẩn, cập nhật state khi request thành công và tránh để state client thay thế kết quả backend.
