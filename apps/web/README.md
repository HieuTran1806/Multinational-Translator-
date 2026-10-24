# Thuyết minh – Web User (UC01–UC05)

Ứng dụng web (ưu tiên điện thoại) dành cho khách tham quan: quét QR để kích hoạt quyền, chọn ngôn ngữ, khám phá bản đồ các điểm POI, tìm kiếm địa điểm, xem chi tiết và nghe thuyết minh audio. **Không cần tài khoản**: khách quét QR dùng một lần, nhận quyền có thời hạn gắn với thiết bị (UC02).

## Phạm vi theo ca sử dụng

| Ca sử dụng | Màn hình / thành phần |
|---|---|
| UC01 – Chọn / chuyển đổi ngôn ngữ | `i18n/LanguageContext.jsx` (danh sách lấy từ `GET /public/languages`, lưu `localStorage`), `i18n/messages.js` (chữ giao diện vi/en, fallback en → vi), `components/LanguageSwitcher.jsx` (header, có cả ở màn quét QR) |
| UC02 – Quét QR và kích hoạt quyền | `features/access/ScanPage.jsx` (`/welcome`: hướng dẫn, quét camera `QrScanner.jsx`, nhập mã), `ActivatePage.jsx` (`/activate?t=…`), `access/AccessContext.jsx` (trạng thái quyền, khôi phục phiên, hết hạn), `access/RequireAccess.jsx` (chặn trang khi chưa có quyền), `access/AccessBadge.jsx` (thời gian còn lại) |
| UC03 – Khám phá bản đồ tương tác | `features/explore/ExplorePage.jsx` (bản đồ Leaflet + marker cluster, nút định vị, banner mất mạng), `PoiMap.jsx`, `PoiListPanel.jsx` |
| UC04 – Xem chi tiết POI | `features/detail/PoiDetailPage.jsx` (nội dung theo ngôn ngữ, fallback, gallery ảnh `ImageGallery.jsx`) |
| UC05 – Nghe thuyết minh POI | `features/audio/NarrationPlayer.jsx` + `useNarrationPlayer.js` (phát/tạm dừng/tiếp tục/dừng, seek, xử lý lỗi và thử lại) |

### Luồng UC02

```
Khách quét QR bằng camera điện thoại ──► mở link /activate?t=<token>  ─┐
Khách mở app (/welcome) ─► quét bằng camera trong app / nhập mã ───────┤
                                                                         ▼
          POST /public/access/redeem { qrToken, deviceId } ──► grant { accessToken, expiresAt }
                                                                         ▼
     Mọi request sau gửi: Authorization: Bearer <accessToken> + X-Device-Id: <deviceId>
```

- `deviceId` sinh ngẫu nhiên **một lần** cho mỗi trình duyệt (`access/grantStore.js`); backend gắn grant với hash của nó.
- Token bị xoá khỏi thanh địa chỉ ngay khi mở `/activate?t=…`; một mã chỉ được gửi redeem một lần kể cả khi React StrictMode chạy effect hai lần.
- Mở lại app: grant đã lưu được xác minh lại bằng `GET /public/access/me` (A1). Mất mạng lúc xác minh → không cho vào, có nút thử lại (E5).
- Hết hạn (đúng giờ `expiresAt`), bị thu hồi hoặc dùng sai thiết bị (backend trả `401 ACCESS_REQUIRED`) → về `/welcome` kèm thông báo.
- Ảnh/audio cần grant nên được tải bằng `fetch` + object URL (`api/useProtectedMedia.js`, `components/ProtectedImage.jsx`), vì `<img>`/`<audio>` không gửi được header.
- Thư viện giải mã QR (`jsqr`) chỉ tải khi mở camera; trình duyệt có `BarcodeDetector` (Chrome Android) dùng bộ giải mã có sẵn.

Các luồng ngoại lệ được xử lý theo đặc tả: bản đồ không tải được (E1) có nút thử lại, API POI lỗi (E2) có thử lại, mất mạng (E3) có banner; thiếu bản dịch hiển thị theo ngôn ngữ fallback kèm thông báo (A1), POI không có audio vẫn hiện bản đọc (A2), POI ẩn/xóa đưa về bản đồ (E1 của UC04).

## Chạy local

Yêu cầu Node ≥ 22.11. Khởi động backend + PostgreSQL theo [README gốc](../../README.md) trước.

```powershell
cd apps/web
npm install
npm run dev          # http://localhost:5174
```

Dev server proxy `/api` sang `http://127.0.0.1:8080` và bỏ header `Origin`, nên request là cùng origin như khi deploy chung domain (xem `vite.config.js`).

Lấy mã QR để thử: dùng `DEMO-QR-0002`/`DEMO-QR-0003` (profile dev, xem `services/backend/src/main/resources/db/demo/README.md`) hoặc Admin tạo mới qua `POST /api/v1/admin/access-qrs` — response có `activationUrl` để mở thẳng.

### Thử trên điện thoại

- **Máy ảo Android:** `adb reverse tcp:5174 tcp:5174` rồi mở `http://localhost:5174` trong Chrome của máy ảo (localhost là kết nối bảo mật nên camera được phép dùng).
- **Điện thoại thật cùng Wi-Fi:** `npm run dev -- --host`, mở `http://<IP-máy-tính>:5174`. Trình duyệt chỉ cho dùng camera trên HTTPS hoặc localhost, nên qua IP LAN hãy dùng ô **nhập mã** hoặc quét QR bằng app camera của điện thoại (link `activationUrl` phải trỏ tới IP này: đặt `APP_ACCESS_ACTIVATION_URL=http://<IP>:5174/activate` cho backend).

### Chạy không cần backend (mock)

```powershell
$env:VITE_USE_MOCK = "true"; npm run dev
```

Mock (`src/api/mock/`) phục vụ dữ liệu demo quanh khu vực Củ Chi, ảnh SVG và audio WAV dựng sẵn (nghe được thật). Kịch bản thử nghiệm có sẵn:

- Kích hoạt: mã bất kỳ → thành công (24 giờ); `MOCK-USED` → đã sử dụng (E2); `MOCK-BAD` → không hợp lệ (E1).
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

- Danh sách POI lấy theo trang (`size=100`, tối đa 10 trang) rồi tìm kiếm phía client bằng `features/explore/search.js` (bỏ dấu tiếng Việt, nhiều từ khoá AND, mã ngôn ngữ khớp chính xác) vì API public chưa hỗ trợ tham số `q`.
- Thêm ngôn ngữ giao diện: thêm từ điển vào `i18n/messages.js` (khoá giống `vi`). Ngôn ngữ nội dung chưa có từ điển giao diện sẽ hiện giao diện tiếng Anh.
- Bản đồ dùng OpenStreetMap tiles + `leaflet.markercluster`; marker là `divIcon` SVG nên không phụ thuộc asset ảnh của Leaflet.
