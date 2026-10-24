# Database migrations

Chứa các migration theo quy ước và thứ tự hiện có của dự án. Mỗi migration nên có mục tiêu rõ ràng, chạy được trên schema dự kiến và không phụ thuộc trạng thái máy cá nhân.

Không sửa migration đã phát hành/đã chạy nếu việc đó làm sai lịch sử schema; tạo migration mới và kiểm tra chiến lược tương thích. Không lưu dữ liệu nhạy cảm.