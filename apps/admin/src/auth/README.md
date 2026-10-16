# Admin Auth

Chứa client-side auth/session integration, thông tin người dùng hiện tại và cơ chế bảo vệ route/hiển thị theo quyền do backend cung cấp.

Đây không phải ranh giới bảo mật cuối cùng: backend phải kiểm tra quyền ở mọi endpoint nhạy cảm. Không log token/secret và không tự suy ra quyền cao hơn từ dữ liệu UI.