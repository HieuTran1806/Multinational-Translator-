# Thuyết minh – Web User (UC03–UC05)

Ứng dụng web dành cho khách tham quan: khám phá bản đồ các điểm POI, tìm kiếm địa điểm, xem chi tiết theo ngôn ngữ và nghe thuyết minh audio. Không cần đăng nhập — mọi endpoint sử dụng đều là public (`/api/v1/public/...`).

## Phạm vi theo ca sử dụng

| Ca sử dụng | Màn hình / thành phần |
|---|---|
| UC03 – Khám phá bản đồ tương tác | `features/explore/ExplorePage.jsx` (bản đồ Leaflet + marker cluster, nút định vị, banner mất mạng), `PoiMap.jsx`, `PoiListPanel.jsx` |
| UC04 – Xem chi tiết POI | `features/detail/PoiDetailPage.jsx` (nội dung theo ngôn ngữ, fallback, gallery ảnh `ImageGallery.jsx`) |
| UC05 – Nghe thuyết minh POI | `features/audio/NarrationPlayer.jsx` + `useNarrationPlayer.js` (phát/tạm dừng/tiếp tục/dừng, seek, xử lý lỗi và thử lại) |
| UC01 (đầu vào) | `i18n/LanguageContext.jsx` + `components/LanguageSwitcher.jsx` — ngôn ngữ chọn lưu ở `localStorage`, làm mới danh sách/chi tiết |

Các luồng ngoại lệ được xử lý theo đặc tả: bản đồ không tải được (E1) có nút thử lại, API POI lỗi (E2) có thử lại, mất mạng (E3) có banner; thiếu bản dịch hiển thị theo ngôn ngữ fallback kèm thông báo (A1), POI không có audio vẫn hiện bản đọc (A2), POI ẩn/xóa đưa về bản đồ (E1 của UC04).

## Chạy local

Yêu cầu Node ≥ 22.11.

```powershell
cd apps/web
npm install
npm run dev          # http://localhost:5174
```

Dev server proxy `/api` sang `http://localhost:8080` (không cần cấu hình CORS; xem `vite.config.js`). Hãy khởi động backend + PostgreSQL theo hướng dẫn trong [README gốc](../../README.md) trước.

### Chạy không cần backend (mock)

```powershell
$env:VITE_USE_MOCK = "true"; npm run dev
```

Mock (`src/api/mock/`) phục vụ dữ liệu demo quanh khu vực Củ Chi, ảnh SVG và audio WAV dựng sẵn (nghe được thật) để kiểm tra UC05 mà không cần backend. Kịch bản thử nghiệm có sẵn:

- `DEMO-VUON-CAO-SU`: không có audio → kiểm tra A2 (chỉ hiện bản đọc).
- `DEMO-TRUONG-BAN`: chỉ có bản dịch tiếng Việt → kiểm tra A1 (fallback khi chọn English).
- URL `/pois/9999`: kiểm tra E1 (POI không tồn tại → quay về bản đồ).

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `VITE_API_BASE_URL` | rỗng (cùng origin qua proxy) | Địa chỉ backend khi deploy khác origin; backend phải cho phép origin này qua `APP_CORS_ALLOWED_ORIGINS` |
| `VITE_USE_MOCK` | `false` | Dùng API mock trong trình duyệt thay vì backend |

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

CI chạy đủ ba bước trên trong job `web-quality`.

## Ghi chú kỹ thuật

- Danh sách POI lấy một trang lớn (`size=200`) rồi tìm kiếm phía client bằng `features/explore/search.js` (bỏ dấu tiếng Việt, nhiều từ khoá AND, mã ngôn ngữ khớp chính xác) vì API public chưa hỗ trợ tham số `q`.
- URL audio/ảnh do API trả về là đường dẫn tương đối; `api/client.js#mediaUrl` nối thêm `API_BASE_URL`.
- Bản đồ dùng OpenStreetMap tiles + `leaflet.markercluster`; marker là `divIcon` SVG nên không phụ thuộc asset ảnh của Leaflet.
