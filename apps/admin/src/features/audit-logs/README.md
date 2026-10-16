# Audit Log — UC16

Chứa giao diện xem và lọc audit log theo phạm vi Use Case, gồm trạng thái empty/error và chi tiết hành động chỉ khi đặc tả đã phê duyệt.

Nguồn audit có thẩm quyền là backend. Không tự thêm Audit Log Detail/export nếu ngoài phạm vi; không để log UI chứa token hoặc dữ liệu nhạy cảm.