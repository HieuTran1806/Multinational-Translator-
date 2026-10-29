# Ứng dụng di động (đã loại bỏ khỏi dự án)

> **Trạng thái:** Ứng dụng di động React Native (`apps/mobile`) đã được loại bỏ có chủ đích. Dự án hiện chỉ chạy web: `apps/admin` (Admin) và `apps/web` (User). Không khôi phục, không phát triển tiếp ứng dụng di động.

## Thay thế

- Ứng dụng User hiện tại là web app `apps/web` (React + Vite, chạy tại `http://127.0.0.1:5174`, proxy `/api` tới backend). Xem `README.md` ở gốc repo và `docs/README.md`.
- Trên điện thoại, mở web app bằng trình duyệt; backend production trên Render là endpoint được hỗ trợ; không mở backend Admin local ra LAN hoặc Internet.

## Lịch sử

Các nội dung cũ (màn hình React Native, offline SQLite, react-native-tts, build Android/iOS) chỉ còn giá trị tham khảo trên nhánh gốc trước khi tách; không áp dụng cho nhánh web-only này.
