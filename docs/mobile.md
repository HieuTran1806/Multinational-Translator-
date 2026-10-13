# Ứng dụng di động (React Native CLI)

## Màn hình (đối chiếu Penpot)

| Penpot | Màn hình MVP | Ghi chú |
|---|---|---|
| M01 Splash/Startup | Màn hình chờ tải cấu hình | |
| M02 Language Selection | `LanguageSelectScreen` (lần đầu) + Cài đặt + chip ngôn ngữ trong chi tiết POI | UI vi/en theo ngôn ngữ thuyết minh |
| M03/M04 Login/Register | **Không có** | Giả định: khách không cần đăng nhập |
| M05 Explore Map | `MapScreen` | Marker, chọn marker → thẻ xem trước → chi tiết |
| — | `PoiListScreen` | Thêm vì yêu cầu MVP: danh sách + truy cập offline khi không có bản đồ |
| M06 POI Detail | `PoiDetailScreen` | Ảnh, mô tả, chọn ngôn ngữ, thuyết minh, tải offline |
| M07 Image Viewer | Backlog | |
| M08 Audio Player | `NarrationControls` trong chi tiết | Phát / Tạm dừng / Tiếp tục / Dừng |
| M09 Auto Narration | Backlog | |
| M10 Offline Management | `OfflineScreen` | Chỉ audio/nội dung, không có Map Pack |
| M11 Profile/Settings | `SettingsScreen` | Ngôn ngữ, địa chỉ máy chủ |

## Cấu hình địa chỉ backend

| Thiết bị | Địa chỉ |
|---|---|
| Android emulator | `http://10.0.2.2:8080` (mặc định) |
| iOS simulator | `http://localhost:8080` (mặc định) |
| Điện thoại thật | `http://<IP-LAN-máy-dev>:8080` qua `.env` `API_BASE_URL` hoặc **Cài đặt → Địa chỉ máy chủ** |

Lấy IP LAN: Windows `ipconfig`, macOS `ipconfig getifaddr en0`, Linux `hostname -I`. Docker Compose đã publish cổng 8080 ra mọi interface ở môi trường dev.

Hoặc dùng `adb reverse tcp:8080 tcp:8080` (điện thoại Android qua USB) rồi đặt địa chỉ `http://localhost:8080`.

## Phát thuyết minh

Thứ tự ưu tiên (`src/audio/sourceResolver.ts`):

1. File audio đã tải về, đã kiểm tra kích thước + SHA-256 khi tải, cùng `contentVersion` với nội dung đang hiển thị.
2. Audio online cùng `contentVersion` khi có mạng.
3. Không có audio → **đề xuất** đọc bằng giọng thiết bị (người dùng bấm xác nhận).

Đổi POI, đổi ngôn ngữ, chuyển sang giọng thiết bị hoặc rời màn hình đều dừng nguồn đang phát (`narrationController`), không phát chồng.

## Giọng đọc của thiết bị (react-native-tts)

Trước khi đọc, app kiểm tra:

- Có TTS engine không (`getInitStatus`).
- Có giọng **đúng ngôn ngữ** không — không bao giờ dùng giọng ngôn ngữ khác.
- Giọng đã cài dữ liệu chưa (`notInstalled`).
- Khi offline: chỉ chấp nhận giọng `networkConnectionRequired = false`.

Thiếu giọng → thông báo + nút "Mở cài đặt giọng đọc" (Android, khi có mạng: `Tts.requestInstallData()`). Không đảm bảo mọi thiết bị có giọng tiếng Việt offline. Android không hỗ trợ tạm dừng TTS nên chỉ có Phát/Dừng; văn bản dài được chia đoạn ≤ 3500 ký tự.

`react-native-tts` 4.1.1 là thư viện cũ (2024): file Gradle gốc dùng `jcenter()` và AGP 1.x không chạy với Gradle 9. Dự án vá bằng **patch-package** (`patches/react-native-tts+4.1.1.patch`, tự áp dụng ở `postinstall`). Thư viện chạy qua lớp interop của New Architecture — **chưa kiểm chứng trên thiết bị**.

## Offline

- SQLite (`@op-engineering/op-sqlite`): bảng `kv`, `offline_poi` (manifest JSON, phiên bản, trạng thái), `offline_audio` (đường dẫn, sha256, kích thước, trạng thái).
- File: `<DocumentDirectory>/offline/poi-<id>/<lang>-v<contentVersion>-<sha>.ext`.
- Tải: ghi ra `.part` → kiểm tra size + SHA-256 → đổi tên; lỗi thử lại tối đa 3 lần (1s, 2s, 4s).
- Trạng thái: `DOWNLOADING`, `READY`, `PARTIAL` (một số file lỗi hoặc file bị mất → cần sửa), `FAILED`.
- Cập nhật: so `manifestVersion` với server; tải lại chỉ những file thay đổi, xoá file phiên bản cũ.
- Xoá: xoá thư mục + metadata.
- Khi mất mạng: tab Địa điểm hiển thị POI đã tải; chi tiết dùng nội dung/audio local. Bản đồ không dùng offline.

## Build Android

```bash
cd apps/mobile
npm ci                       # chạy patch-package
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Yêu cầu JDK 17, Android SDK theo `android/build.gradle` (compileSdk 37, buildTools 37.0.0, NDK 27.1.12297006). Lần build đầu tải nhiều dependency (Gradle, Maven Google) và biên dịch C++ (op-sqlite, New Architecture).

## iOS (chưa kiểm chứng)

```bash
cd apps/mobile/ios
bundle install
bundle exec pod install
cd .. && npm run ios
```

Cần macOS + Xcode. Thêm cấu hình Google Maps iOS theo `docs/google-maps.md`. `react-native-tts` và `react-native-sound` cần kiểm tra lại trên iOS (audio session `Playback`).

## Kiểm thử thủ công đề xuất

1. Backend dev đang chạy → mở app → chọn tiếng Việt → tab Địa điểm thấy 2 POI `[DEMO]`, không thấy POI nháp.
2. Mở POI → Phát (nghe tiếng bíp demo) → Tạm dừng → Tiếp tục → Dừng.
3. Đổi chip sang English → âm thanh trước dừng, nội dung tiếng Anh.
4. Bấm "Tải để dùng offline" → bật chế độ máy bay → mở lại POI từ tab Địa điểm → phát được audio local.
5. Admin sửa nội dung thuyết minh EN → app (online) không phát audio cũ, đề xuất giọng thiết bị; trang chi tiết POI báo "Có bản cập nhật" cho dữ liệu offline.
6. Tắt mạng, chọn ngôn ngữ chưa cài giọng offline → thấy thông báo thiếu giọng.
