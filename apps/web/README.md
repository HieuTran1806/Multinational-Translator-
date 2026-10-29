# Hướng dẫn chạy — Web User

Web User được triển khai trên Cloudflare Pages và gọi backend production trên Render. Đây là luồng chạy mặc định dành cho khách tham quan; không cần chạy Web User local để sử dụng ứng dụng.

## Cấu hình production

- Build root: `apps/web`.
- Build command: `npm ci` và `npm run build:production`.
- Output directory: `dist`.
- `VITE_API_BASE_URL=https://multitional-translator-api.onrender.com`.
- `VITE_USE_MOCK=false`.

Không đưa credentials Neon hoặc secrets backend vào biến `VITE_*`. Trình duyệt chỉ gọi REST API; backend mới kết nối database.

## Kiểm thử mã nguồn

```powershell
npm ci
npm run lint
npm test
npm run build
```

Chạy các lệnh trong `apps/web`. Những lệnh này phục vụ kiểm tra mã nguồn, không tạo một phương án triển khai production khác.

Xem [hướng dẫn chạy chung](../../README.md) và [triển khai](../../docs/operations/deployment.md).


## Role scope hiện hành
Web User không có chức năng quản trị hoặc phụ thuộc role Seller. QR activation, bản đồ, POI và audio được kiểm tra theo grant/publish/media ở backend. Seller đã bị loại bỏ khỏi API và dữ liệu.
