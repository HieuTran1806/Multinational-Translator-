# Database resources

Chứa tài nguyên database đi kèm backend. `migration/` chứa schema/data migration có thứ tự; `demo/` chứa dữ liệu phục vụ môi trường demo nếu được quản lý trong repository.

Không đặt dữ liệu production/PII hoặc secret vào đây. Không sửa migration đã áp dụng nếu chưa có chiến lược rõ ràng; kiểm tra thứ tự và test database sau thay đổi.