# Backend Text-to-Speech

Chứa tích hợp text-to-speech và điều phối quá trình tạo audio từ nội dung văn bản, bao gồm kết quả, lỗi nhà cung cấp và trạng thái xử lý.

Tách provider integration khỏi POI/controller. Không log secret; credentials lấy từ môi trường. Xử lý timeout/failure và chỉ đánh dấu hoàn tất khi kết quả đã được xác nhận/lưu thành công.