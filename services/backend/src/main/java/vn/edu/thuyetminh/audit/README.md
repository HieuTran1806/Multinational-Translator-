# Audit Domain — UC16

Thư mục đích cho ghi nhận và truy vấn audit log theo UC16, gồm actor, action, target, timestamp và metadata an toàn khi các trường này được đặc tả.

Audit phải được ghi từ backend cho hành động cần kiểm toán; không tin dữ liệu audit do frontend gửi. Không ghi password, token hoặc secret. Chỉ cung cấp lọc/xem trong phạm vi được duyệt.