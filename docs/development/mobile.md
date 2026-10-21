# Ứng dụng di động (React Native CLI)

> **Trạng thái phạm vi:** ứng dụng User mục tiêu chỉ hoạt động khi có mạng (online-only). Các hướng dẫn ngoại tuyến bên dưới mô tả mã nguồn/kiểm thử cũ hiện có, không phải yêu cầu nghiệm thu hoặc tính năng cần tiếp tục phát triển. Không bổ sung tải để dùng ngoại tuyến, ngoại tuyến map, POI hoặc audio.

## Màn hình (đối chiếu Penpot)

| Penpot | Màn hình MVP | Ghi chú |
|---|---|---|
| M01 Khởi động | Màn hình chờ tải cấu hình | |
| M02 Chọn ngôn ngữ | `LanguageSelectScreen` (lần đầu) + Cài đặt + chip ngôn ngữ trong chi tiết POI | UI vi/en theo ngôn ngữ thuyết minh |
| M03/M04 Đăng nhập/Đăng ký | **Không có** | Giả định: khách không cần đăng nhập |
| M05 Khám phá bản đồ | `MapScreen` | Điểm đánh dấu, chọn điểm đánh dấu → thẻ xem trước → chi tiết |
| — | `PoiListScreen` | Thêm vì yêu cầu MVP: danh sách + truy cập ngoại tuyến khi không có bản đồ |
| M06 Chi tiết POI | `PoiDetailScreen` | Ảnh, mô tả, chọn ngôn ngữ, thuyết minh, tải để dùng ngoại tuyến |
| M07 Trình xem hình ảnh | Danh sách công việc tồn đọng | |
| M08 Trình phát âm thanh | `NarrationControls` trong chi tiết | Phát / Tạm dừng / Tiếp tục / Dừng |
| M09 Thuyết minh tự động | Danh sách công việc tồn đọng | |
| M10 Quản lý ngoại tuyến | `OfflineScreen` | Chỉ âm thanh/nội dung, không có gói bản đồ |
| M11 Hồ sơ/Cài đặt | `SettingsScreen` | Ngôn ngữ, địa chỉ máy chủ |

## Cấu hình địa chỉ backend

| Thiết bị | Địa chỉ |
|---|---|
| Android emulator | `http://10.0.2.2:8080` (mặc định) |
| iOS simulator | `http://localhost:8080` (mặc định) |
| Điện thoại thật | `http://<IP-LAN-máy-dev>:8080` qua `.env` `API_BASE_URL` hoặc **Cài đặt → Địa chỉ máy chủ** |

Lấy địa chỉ IP mạng LAN: Windows `ipconfig`, macOS `ipconfig getifaddr en0`, Linux `hostname -I`. Docker Compose đã publish cổng 8080 ra mọi interface ở môi trường dev.

Hoặc dùng `adb reverse tcp:8080 tcp:8080` (điện thoại Android qua USB) rồi đặt địa chỉ `http://localhost:8080`.

## Phát thuyết minh

Thứ tự ưu tiên (`src/audio/sourceResolver.ts`):

1. Tệp âm thanh đã tải về, đã kiểm tra kích thước + SHA-256 khi tải, cùng `contentVersion` với nội dung đang hiển thị.
2. Âm thanh trực tuyến cùng `contentVersion` khi có mạng.
3. Không có audio → **đề xuất** đọc bằng giọng thiết bị (người dùng bấm xác nhận).

Đổi POI, đổi ngôn ngữ, chuyển sang giọng thiết bị hoặc rời màn hình đều dừng nguồn đang phát (`narrationController`), không phát chồng.

## Giọng đọc của thiết bị (react-native-tts)

Trước khi đọc, ứng dụng kiểm tra:

- Có TTS engine không (`getInitStatus`).
- Có giọng **đúng ngôn ngữ** không — không bao giờ dùng giọng ngôn ngữ khác.
- Giọng đã cài dữ liệu chưa (`notInstalled`).
- Khi ngoại tuyến: chỉ chấp nhận giọng `networkConnectionRequired = false`.

Thiếu dữ liệu giọng đọc → thông báo + nút "Mở cài đặt giọng đọc" (Android, khi có mạng: `Tts.requestInstallData()`). Không đảm bảo mọi thiết bị có giọng tiếng Việt ngoại tuyến. Android không hỗ trợ tạm dừng TTS nên chỉ có Phát/Dừng; văn bản dài được chia đoạn ≤ 3500 ký tự.

`react-native-tts` 4.1.1 là thư viện cũ (2024): file Gradle gốc dùng `jcenter()` và AGP 1.x không chạy với Gradle 9. Dự án vá bằng **patch-package** (`patches/react-native-tts+4.1.1.patch`, tự áp dụng ở `postinstall`). Thư viện chạy qua lớp interop của Kiến trúc mới — **chưa kiểm chứng trên thiết bị**.

## Ngoại tuyến

- SQLite (`@op-engineering/op-sqlite`): bảng `kv`, `offline_poi` (manifest JSON, phiên bản, trạng thái), `offline_audio` (đường dẫn, sha256, kích thước, trạng thái).
- File: `<DocumentDirectory>/offline/poi-<id>/<lang>-v<contentVersion>-<sha>.ext`.
- Tải: ghi ra `.part` → kiểm tra kích thước + SHA-256 → đổi tên; lỗi thử lại tối đa 3 lần (1s, 2s, 4s).
- Trạng thái: `DOWNLOADING`, `READY`, `PARTIAL` (một số file lỗi hoặc file bị mất → cần sửa), `FAILED`.
- Cập nhật: so `manifestVersion` với server; tải lại chỉ những file thay đổi, xoá file phiên bản cũ.
- Xoá: xoá thư mục + metadata.
- Khi mất mạng: tab Địa điểm hiển thị POI đã tải; chi tiết dùng nội dung/âm thanh cục bộ. Bản đồ không dùng ngoại tuyến.

## Biên dịch ứng dụng Android

```bash
cd apps/mobile
npm ci                       # chạy patch-package
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Yêu cầu JDK 17, Android SDK theo `android/build.gradle` (compileSdk 37, buildTools 37.0.0, NDK 27.1.12297006). Lần build đầu tải nhiều thư viện phụ thuộc (Gradle, Maven Google) và biên dịch C++ (op-sqlite, Kiến trúc mới).

## iOS (chưa kiểm chứng)

```bash
cd apps/mobile/ios
bundle install
bundle exec pod install
cd .. && npm run ios
```

Cần macOS + Xcode. Thêm cấu hình Google Maps iOS theo `docs/integrations/google-maps.md`. `react-native-tts` và `react-native-sound` cần kiểm tra lại trên iOS (audio session `Playback`).

## Kiểm thử thủ công đề xuất

1. Backend dev đang chạy → mở app → chọn tiếng Việt → tab Địa điểm thấy 2 POI `[DEMO]`, không thấy POI nháp.
2. Mở POI → Phát (nghe tiếng bíp demo) → Tạm dừng → Tiếp tục → Dừng.
3. Đổi chip sang English → âm thanh trước dừng, nội dung tiếng Anh.
4. Bấm "Tải để dùng ngoại tuyến" → bật chế độ máy bay → mở lại POI từ tab Địa điểm → phát được âm thanh cục bộ.
5. Admin sửa nội dung thuyết minh EN → app (online) không phát âm thanh cũ, đề xuất giọng thiết bị; trang chi tiết POI báo "Có bản cập nhật" cho dữ liệu ngoại tuyến.
6. Tắt mạng, chọn ngôn ngữ chưa cài giọng ngoại tuyến → thấy thông báo thiếu giọng.
