# Audit Domain — UC15

Audit events được ghi từ backend cho thao tác nhạy cảm. Chỉ `SUPER_ADMIN` được đọc Audit Log; Admin không được đọc log toàn hệ thống.

Không ghi password/token/secret. Migration V6 loại bỏ Seller-only records nếu có và giữ audit records dùng chung/ngoài phạm vi.
