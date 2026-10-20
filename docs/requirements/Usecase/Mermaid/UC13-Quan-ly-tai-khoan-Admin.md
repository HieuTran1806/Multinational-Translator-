# UC13 — Quản lý tài khoản Admin

**Actor:** Super Admin  
**Phạm vi:** Chỉ các account có role `admin`; account mới mặc định role `admin`.

```mermaid
flowchart TD
    A([Mở Quản lý tài khoản Admin]) --> B[Hiển thị danh sách account role admin]
    B --> C{Chọn operation}
    C -- Tạo --> D[Nhập thông tin account mới]
    D --> E[Tạo account với role mặc định admin]
    C -- Xem/chỉnh sửa --> F[Chọn account Admin]
    F --> G{Account còn tồn tại?}
    G -- Không --> H[Báo không tồn tại và làm mới danh sách] --> B
    G -- Có --> I{Operation}
    I -- Xem --> J[Hiển thị thông tin account] --> B
    I -- Chỉnh sửa --> K[Cập nhật field được phép; không đổi role tại UC13] --> L{CRUD thành công?}
    I -- Xóa --> M[Xác nhận và soft-delete] --> L
    E --> L
    L -- Không --> N[Hiển thị lỗi thao tác] --> B
    L -- Có --> O[Cập nhật danh sách/kết quả] --> B
    B --> P([Kết thúc khi rời chức năng])
```

**Ghi chú:** Activate/Deactivate và reset password thuộc phạm vi UC13 theo đặc tả; gán/thay đổi role thuộc UC14.