# UC01 — Đăng ký tài khoản

**Actor:** Tourist  
**Nguồn đặc tả:** `docs/requirements/Use_Case_Specification_Final_16_UC.md`

```mermaid
flowchart TD
    A([Bắt đầu: Tourist chưa xác thực]) --> B[Chọn Đăng ký]
    B --> C[Hiển thị form: Username, Password, Confirm Password]
    C --> D{Hủy đăng ký?}
    D -- Có --> X[Không tạo tài khoản] --> L[Chuyển về Login] --> Z([Kết thúc])
    D -- Không --> E[Nhập thông tin và gửi]
    E --> F{Dữ liệu hợp lệ?}
    F -- Không --> G[Hiển thị lỗi tại trường, yêu cầu sửa] --> C
    F -- Có --> H{Username đã tồn tại, không phân biệt hoa thường?}
    H -- Có --> I[Báo trùng Username, yêu cầu chọn tên khác] --> C
    H -- Không --> J[Tạo tài khoản Tourist]
    J --> K[Thông báo đăng ký thành công]
    K --> M[Không tự động đăng nhập; yêu cầu UC02] --> Z
```

**Quy tắc chính:** Username 3–20 ký tự theo quy tắc đặc tả; Password tối thiểu 6 ký tự và phải khớp Confirm Password. Không hợp lệ thì không tạo tài khoản.