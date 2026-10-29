# Web Admin — React + Vite

> **Ma trận quyền hiện hành:** Admin có POI/bản dịch/media/QR/Analytics; Super Admin có quản lý tài khoản Admin và Audit Log. Không còn Seller UI/API; UC09/UC13 đã loại bỏ, UC12 chỉ quản lý QR. Xem [ma trận quyền chuẩn](../../docs/planning/role-matrix-seller-removal-plan.md).

Web Admin được chạy **local-only**. Cách chạy chính thức là giao diện local → backend Spring Boot local (`local-neon`) → Neon PostgreSQL. Không deploy Admin lên Internet.

## Khởi chạy

1. Đảm bảo file `.env.local` tại thư mục gốc có `DATABASE_URL` cho Neon branch đã xác nhận.
2. Từ thư mục gốc, mở terminal backend và chạy:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/run-local-neon.ps1
   ```

3. Mở terminal khác:

   ```powershell
   Set-Location "D:\Documents\Cong_nghe_phan_mem\Multitional-Translator-\apps\admin"
   npm ci
   npm run dev
   ```

4. Truy cập <http://localhost:5173>. Backend mặc định ở <http://localhost:18081>; health check tại `/actuator/health`.

Cấu hình `VITE_API_BASE_URL=http://localhost:18081` và `VITE_USE_MOCK=false` trong file môi trường local. Các biến `VITE_*` là công khai và được nhúng vào bundle; không đặt credentials trong đó. Tránh tạo `.env.local`/`.env` với cấu hình khác nhau gây gọi nhầm backend.

**Cảnh báo dữ liệu:** backend local ghi vào Neon branch trong `DATABASE_URL`. Kiểm tra đúng project/branch trước khi thao tác. Không dùng production cho integration test.

## Kiểm thử và build

```powershell
npm run lint
npm test
npm run build
```

`scripts/verify-e2e.mjs` là kiểm thử đầu cuối có ghi dữ liệu; chỉ chạy với database và tài khoản kiểm thử riêng, không chạy trên production. Mock API vẫn tồn tại cho các bài test UI tự động, nhưng không phải cách chạy ứng dụng mặc định và không dùng để xác minh tích hợp thật.

Xem thêm [hướng dẫn chạy chung](../../README.md) và [báo cáo kiểm chứng Admin](../../docs/reports/admin-module-verification.md).
