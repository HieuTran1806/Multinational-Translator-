# Audit Log — UC15

Chỉ `SUPER_ADMIN` được đọc `/api/v1/admin/audit/**`. Backend là nguồn audit có thẩm quyền; UI không tự tạo hoặc sửa log và không hiển thị token/credential.

Seller-only action labels đã loại bỏ; log dùng chung hoặc log Admin/Super Admin ngoài phạm vi xóa vẫn được bảo toàn.
