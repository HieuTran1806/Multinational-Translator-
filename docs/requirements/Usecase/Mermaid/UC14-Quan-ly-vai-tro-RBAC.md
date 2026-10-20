# UC14 — Quản lý vai trò và phân quyền (RBAC)

**Actor:** Super Admin

```mermaid
flowchart TD
    A([Mở chức năng RBAC]) --> B[Hiển thị danh sách role]
    B --> C{Chọn operation}
    C -- Xem/chỉnh sửa --> D[Chọn role và hiển thị permission array]
    D --> E[Chỉnh sửa role/permission array]
    E --> F[Validate role name duy nhất và permission thuộc registry tĩnh]
    F --> G{Lưu hợp lệ?}
    G -- Không --> H[Báo lỗi; giữ dữ liệu hiện tại] --> D
    G -- Có --> I[Lưu cấu hình role]
    C -- Tạo role --> J[Nhập tên role và permission array]
    J --> F
    C -- Xóa role --> K{Là system role hoặc đang được sử dụng?}
    K -- Có --> L[Từ chối xóa và thông báo lý do] --> B
    K -- Không --> M[Xóa role theo CRUD Roles] --> N{Thao tác thành công?}
    I --> N
    N -- Không --> O[Báo lỗi; cho phép thử lại] --> B
    N -- Có --> P[Cập nhật danh sách/cấu hình role] --> B
    C -- Xem permission definitions --> Q[Đọc static permission registry; không CRUD permission riêng] --> B
    B --> R([Kết thúc khi rời chức năng])
```

**Quy tắc:** Account có một role; không gán permission trực tiếp cho account. UC14 quản lý role và permission array, không CRUD định nghĩa permission tĩnh.