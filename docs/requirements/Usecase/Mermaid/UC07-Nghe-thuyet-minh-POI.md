# UC07 — Nghe thuyết minh POI

**Actor:** Tourist  
**Điểm vào:** POI Detail có chức năng audio.

```mermaid
flowchart TD
    A([Tourist chọn Nghe thuyết minh]) --> B[Xác định POI và audio locale]
    B --> C[Kiểm tra narration/audio asset]
    C --> D{Audio asset khả dụng?}
    D -- Không --> E[Thông báo audio không khả dụng] --> Z([Kết thúc])
    D -- Có --> F{Nguồn yêu cầu network?}
    F -- Có --> G{Network khả dụng?}
    G -- Không --> H[Báo lỗi do nguồn audio cần mạng] --> Z
    G -- Có --> I[Tải/đọc audio, có thể dùng cache]
    F -- Không --> I
    I --> J{Audio load thành công?}
    J -- Không --> K[Thông báo lỗi tải/phát] --> Z
    J -- Có --> L[Khởi động playback]
    L --> M[Tourist nghe; cập nhật trạng thái playback]
    M --> N{Tourist kết thúc hoặc audio phát xong?}
    N -- Chưa --> M
    N -- Rồi --> O[Cập nhật trạng thái; giữ ở POI Detail]
    O --> P([Kết thúc])
```

**Ngoại lệ:** Asset không khả dụng, lỗi tải/phát, hoặc network không khả dụng khi nguồn audio bắt buộc dùng network.