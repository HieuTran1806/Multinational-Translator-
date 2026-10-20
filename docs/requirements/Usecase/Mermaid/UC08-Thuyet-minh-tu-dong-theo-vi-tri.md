# UC08 — Nhận thuyết minh tự động theo vị trí

**Actor:** Tourist

```mermaid
flowchart TD
    A([Tourist di chuyển; Tourist Core đang hoạt động]) --> B[LocationService nhận position updates]
    B --> C{GPS accuracy đạt threshold?}
    C -- Không --> D[Bỏ qua/chờ position đạt yêu cầu] --> B
    C -- Có --> E[GeofenceEngine tính khoảng cách POI bằng turf.distance]
    E --> F{Trong geofence radius?}
    F -- Không --> B
    F -- Có --> G[Tạo pending entry và debounce; mặc định radius 30m]
    G --> H{Ở trong vùng đủ 3 giây?}
    H -- Không --> I[Hủy pending entry nếu rời vùng] --> B
    H -- Có --> J[Xác nhận ENTER]
    J --> K{Nhiều geofence chồng lấn?}
    K -- Có --> L[Chọn POI phù hợp theo quy tắc quyết định]
    K -- Không --> M[Chọn POI đã vào vùng]
    L --> N{Đang có audio narration khác phát?}
    M --> N
    N -- Có --> O[Áp dụng chính sách xử lý narration đang phát]
    N -- Không --> P[Chuyển yêu cầu tới NarrationEngine]
    O --> P
    P --> Q[Resolve audio: audio_url/cache, on-demand TTS hoặc local/browser TTS]
    Q --> R{Có nguồn narration hoạt động?}
    R -- Không --> S[Báo/ghi nhận thất bại; không phát] --> B
    R -- Có --> T[Bắt đầu automatic narration; cập nhật POI UI]
    T --> U[Nhận event kết thúc playback]
    U --> V[Cập nhật trạng thái narration/UI]
    V --> B
```

**Ghi chú:** Sơ đồ giữ riêng UC08 với UC07; dùng chung cơ chế audio nhưng trigger là geofence. Các nguồn audio theo đặc tả gồm pre-generated, on-demand TTS/localization, realtime cloud TTS và local/browser TTS cho hybrid audio.