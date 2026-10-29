# Backend Auth

Chứa login, logout, bearer token/session và account identity. Account roles hiện hành chỉ gồm `ADMIN` và `SUPER_ADMIN`; User access được cấp qua QR grant, không phải account role.

Không còn đăng nhập/session Seller. Không log password/token; soft-deleted hoặc disabled account không được đăng nhập hoặc dùng session đã bị vô hiệu hóa.
