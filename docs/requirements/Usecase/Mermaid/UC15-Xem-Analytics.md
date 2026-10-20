# UC15 — Xem Analytics

**Actor:** Admin, Super Admin  
**Precondition:** Đã xác thực và có quyền `analytics:view`.

```mermaid
flowchart TD
    A([Chọn Analytics]) --> B[Xác thực quyền runtime]
    B --> C{Có quyền analytics:view?}
    C -- Không --> X[Thông báo không có quyền] --> Z([Kết thúc])
    C -- Có --> D[Mở Analytics Dashboard]
    D --> E[Tải analytics read models]
    E --> F{Data source/read model sẵn sàng?}
    F -- Không --> G[Thông báo lỗi và cho phép thử lại] --> E
    F -- Có --> H[Tổng hợp daily metrics, POI daily metrics và presence theo consent]
    H --> I[Hiển thị stat cards: today_views, audio_plays, searches, top_pois, tracked_online_users]
    I --> J{Thay đổi date range/filter?}
    J -- Có --> K[Áp dụng date range và filter: POI, device, language, region, event type] --> E
    J -- Không --> L[Actor xem số liệu; không thay đổi dữ liệu] --> Z
```

**Giới hạn:** Dashboard dùng stat cards; không có drill-down, chart hoặc export trong UC15. `tracked_online_users` là anonymous devices đã consent trong sliding window.