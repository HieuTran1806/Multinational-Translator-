# Web admin — React (JavaScript) + Vite + Tailwind CSS

```bash
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080
npm ci
npm run dev               # http://localhost:5173
npm run lint && npm test && npm run build
```

## Làm UI khi chưa có backend/DB (mock)

Tạo `apps/admin/.env.local` với `VITE_USE_MOCK=true` rồi `npm run dev`. Mọi lời gọi API được `src/api/mock` trả lời ngay trong trình duyệt, cùng shape và mã lỗi như backend thật. Sidebar hiện nhãn **DỮ LIỆU GIẢ (MOCK)**. Xoá dòng đó để quay lại backend.

- Đăng nhập: tên/mật khẩu bất kỳ; mật khẩu `wrong` → lỗi 401.
- Dữ liệu mẫu: `src/api/mock/fixtures.js` (sửa để tạo trạng thái UI cần xem). Thay đổi được lưu vào localStorage; mở trang với `?mockReset` để về dữ liệu gốc.
- TTS giả: job tự chuyển QUEUED → RUNNING → SUCCEEDED sau ~4 giây; nội dung chứa `#fail` → FAILED.
- Thêm endpoint mới: thêm vào `endpoints.js` như bình thường, rồi thêm `on('METHOD', '/path/:id', handler)` trong `src/api/mock/handlers.js`.

Trang: Đăng nhập · Danh sách POI (lọc, tìm, phân trang) · Tạo/sửa POI · Công khai/Nháp · Nội dung theo ngôn ngữ · Tải audio / tạo TTS (polling trạng thái) · Ảnh đại diện.
Triển khai Vercel: [`../../docs/operations/deployment.md`](../../docs/operations/deployment.md).
