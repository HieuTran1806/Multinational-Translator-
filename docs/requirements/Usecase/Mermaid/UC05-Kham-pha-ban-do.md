# UC05 — Khám phá bản đồ tương tác

**Actor:** Tourist  
**Precondition:** Có authenticated session.

```mermaid
flowchart TD
    A([Mở Map sau đăng nhập]) --> B[Khởi tạo map và chọn cloud/local source]
    B --> C{Có nguồn bản đồ khả dụng?}
    C -- Không --> E[Thử fallback; báo lỗi nếu vẫn không render được] --> F{Có map/cache dùng được?}
    F -- Không --> Z([Kết thúc hạn chế])
    F -- Có --> G[Tải hoặc đọc cache POI]
    C -- Có --> G
    G --> H{POI data tải được?}
    H -- Không --> I[Dùng snapshot/cache nếu có; nếu không thì hiển thị map không có POI]
    H -- Có --> J[Hiển thị POI theo locale hiện tại]
    I --> K[Tourist pan/zoom]
    J --> K
    K --> L{Chọn Locate Me?}
    L -- Có --> M{Được cấp quyền vị trí?}
    M -- Có --> N[LocationService lấy vị trí và cập nhật map] --> O[Tiếp tục khám phá]
    M -- Không --> P[Giữ tâm map hiện tại/mặc định] --> O
    L -- Không --> O
    O --> Q{Chọn POI?}
    Q -- Chọn POI đơn --> R[Xác định POI]
    Q -- Chọn cluster --> S[Hiển thị POI trong cluster; chọn POI cụ thể] --> R
    Q -- Chưa --> K
    R --> T[Đi tới UC06 — Xem chi tiết POI]
    T --> U([Kết thúc])
```

**Ghi chú:** Cluster, pan/zoom và định vị là các nhánh của cùng UC; nguồn bản đồ có thể là MapLibre/cloud hoặc PMTiles/local pack.