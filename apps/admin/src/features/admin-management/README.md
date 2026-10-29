# Admin Management — UC10

Super Admin quản lý **tài khoản Admin בלבד**: danh sách/tìm kiếm, xem chi tiết, tạo Admin, sửa tên hiển thị, khóa/mở khóa, reset mật khẩu và xóa mềm. Vai trò được cố định là `ADMIN`; không có thao tác tạo Super Admin hoặc chỉnh role tại module này.

- UI: `apps/admin/src/pages/AdminAccountsPage.jsx` (route `/accounts`, chỉ hiện với `SUPER_ADMIN`).
- API: `adminAccountsApi` trong `apps/admin/src/api/endpoints.js` → `/api/v1/admin/accounts/**`.
- Backend: `vn.edu.thuyetminh.admin` (`AdminAccountController`/`AdminAccountService`), matcher `SUPER_ADMIN` trong `SecurityConfig` khai báo trước `/api/v1/admin/**`.
- Account management không được sửa/xóa Super Admin; backend service xác minh role `ADMIN` của target, không chỉ dựa vào UI.
- Vai trò tĩnh `ADMIN` và `SUPER_ADMIN`; không có dynamic RBAC hoặc permission editor.
