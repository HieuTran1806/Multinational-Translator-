# Backend POI

Chứa domain logic, API và persistence cho Point of Interest: dữ liệu địa điểm, chi tiết, trạng thái và các thao tác quản trị theo Use Case.

Tourist đọc thông tin được phép; Admin CRUD/publish phải kiểm tra quyền và validation server-side. Tránh để controller chứa business logic hoặc tự ý thêm operation ngoài hợp đồng đã duyệt.