# services/

Chứa các service chạy phía server. Hiện có `backend/` là API/backend chính.

Business logic, xác thực, phân quyền và kiểm tra dữ liệu có thẩm quyền phải nằm phía server. Không đặt code UI client trong thư mục này; API contract được ghi trong `docs/architecture/api.md`.