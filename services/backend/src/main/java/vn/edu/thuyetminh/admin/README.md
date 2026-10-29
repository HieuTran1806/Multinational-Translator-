# Admin Account Domain — UC10

`AdminAccountController`/`AdminAccountService` chỉ cho `SUPER_ADMIN` quản lý tài khoản role `ADMIN`: list/detail/create/update display name và enabled state/reset password/soft delete.

Role được cố định thành `ADMIN`; Super Admin accounts không được trả về hoặc sửa/xóa qua UC10. Password luôn hash; session invalidation và audit trail tuân theo lifecycle hiện có.
