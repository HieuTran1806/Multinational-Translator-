# Admin Management — UC10

Quản lý tài khoản Admin/Super Admin bởi Super Admin: danh sách có tìm kiếm/lọc vai trò, tạo tài khoản, cập nhật tên hiển thị – vai trò – trạng thái hoạt động, và đặt lại mật khẩu.

- UI: `apps/admin/src/pages/AdminAccountsPage.jsx` (route `/accounts`, chỉ hiện với `SUPER_ADMIN`).
- API: `adminAccountsApi` trong `apps/admin/src/api/endpoints.js` → `/api/v1/admin/accounts/**`.
- Backend: `vn.edu.thuyetminh.admin` (`AdminAccountController`/`AdminAccountService`), matcher `SUPER_ADMIN` trong `SecurityConfig` khai báo trước `/api/v1/admin/**`.
- Quy tắc nghiệp vụ (UC10 §8, E2): không tự vô hiệu hóa, không tự đổi vai trò, sau thao tác phải còn ít nhất một Super Admin đang hoạt động, không quản lý tài khoản Seller ở đây (UC09).
- Vai trò vẫn tĩnh (`ADMIN`, `SUPER_ADMIN`); gán quyền động thuộc UC11 và chưa triển khai.
