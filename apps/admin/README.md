# Web admin — React (JavaScript) + Vite + Tailwind CSS

```bash
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080
npm ci
npm run dev               # http://localhost:5173
npm run lint && npm test && npm run build
```

## Phạm vi hiện có

- Đăng nhập quản trị bằng bearer token của backend (session lưu trong `sessionStorage`, tự hết hạn theo `expiresAt`, 401 → về trang đăng nhập).
- Chỉ vai trò `ADMIN` quản lý POI (UC07). `SUPER_ADMIN` thấy thông báo không đủ quyền; backend cũng trả 403 cho mọi `/api/v1/admin/**`.
- POI: danh sách (tìm kiếm, lọc trạng thái, phân trang, kích thước trang), tạo, sửa, chi tiết, công khai/gỡ công khai, xoá mềm.
- Bản dịch theo ngôn ngữ lấy từ `GET /api/v1/admin/languages` (không hardcode ngôn ngữ), kèm trạng thái audio từng ngôn ngữ.
- Hình ảnh: tải lên (JPEG/PNG/WEBP ≤ 5 MB, tối đa 6 ảnh), xem trước, sắp thứ tự, xoá.
- Audio: tải tệp (MP3/M4A/WAV/OGG ≤ 20 MB), nghe thử, tạo bằng Google TTS + theo dõi job.

Shell (sidebar + topbar) bám theo trang Figma **"MT - Admin Portal"** — frame `MT / Admin / Desktop / Dashboard & POI`. Các frame Figma ngoài phạm vi backend hiện tại (Dashboard thống kê, Xuất CSV, Content Approval, trang Seller) **không** được dựng để tránh nút giả; xem `docs/reports/admin-module-verification.md`.

## Làm UI khi chưa có backend/DB (mock)

Tạo `apps/admin/.env.local` với `VITE_USE_MOCK=true` rồi `npm run dev`. Mọi lời gọi API được `src/api/mock` trả lời ngay trong trình duyệt, cùng shape và mã lỗi như backend thật. Sidebar hiện nhãn **DỮ LIỆU GIẢ (MOCK)**.

- Đăng nhập: tên/mật khẩu bất kỳ; mật khẩu `wrong` → lỗi 401.
- Dữ liệu mẫu: `src/api/mock/fixtures.js` (sửa để tạo trạng thái UI cần xem). Thay đổi được lưu vào localStorage; mở trang với `?mockReset` để về dữ liệu gốc.
- TTS giả: job tự chuyển QUEUED → RUNNING → SUCCEEDED sau ~4 giây; nội dung chứa `#fail` → FAILED.
- Thêm endpoint mới: thêm vào `endpoints.js` như bình thường, rồi thêm `on('METHOD', '/path/:id', handler)` trong `src/api/mock/handlers.js`.

Mock chỉ tồn tại khi bật biến môi trường và bị Vite loại khỏi bundle production (`npm run build` không chứa chunk mock) — luồng production luôn gọi API thật.

Triển khai Vercel: [`../../docs/operations/deployment.md`](../../docs/operations/deployment.md).

## Kiểm chứng đầu cuối với backend thật

`scripts/verify-e2e.mjs` chạy toàn bộ luồng qua API thật (đăng nhập → tạo/sửa POI → bản dịch → ảnh/audio → công khai → đọc lại bằng API public của User Mobile → gỡ công khai → xoá mềm → kiểm tra phân quyền) và tự xoá mềm dữ liệu test:

```bash
E2E_BASE_URL=http://127.0.0.1:8080 \
E2E_ADMIN_USERNAME=admin01 E2E_ADMIN_PASSWORD=123456 \
E2E_SUPER_USERNAME=<super-admin> E2E_SUPER_PASSWORD=<mật khẩu> \
npm run verify:e2e
```

`E2E_SUPER_USERNAME`/`E2E_SUPER_PASSWORD` là tuỳ chọn; thiếu chúng thì bước kiểm tra phân quyền Super Admin được báo `SKIP`. Trên profile `dev`, backend có sẵn tài khoản demo `admin01/123456` (xem `services/backend/src/main/resources/db/demo/README.md`).
