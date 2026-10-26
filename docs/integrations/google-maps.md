# Google Maps (không còn sử dụng)

> **Trạng thái 2026-10-24:** Tích hợp Google Maps (`react-native-maps`) thuộc ứng dụng di động `apps/mobile` đã bị loại bỏ có chủ đích. Dự án hiện web-only.

Bản đồ của web app User (`apps/web/src/features/explore/PoiMap.jsx`) dùng **Leaflet + OpenStreetMap** (và `leaflet.markercluster`), không cần khóa API hay SDK của Google.

Không còn khóa API Maps nào trong repo. Nếu sau này cần tích hợp lại bản đồ thương hiệu Google cho web, tạo khóa mới và giới hạn theo referrer HTTP trong Google Cloud Console.
