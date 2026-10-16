# Google Maps trên mobile

Thư viện: `react-native-maps` 1.29.11 với `PROVIDER_GOOGLE`.

**Trạng thái:** cấu hình Android đã thêm (meta-data API key qua `manifestPlaceholders`), **chưa build/chạy thử** trong môi trường phát triển (không có Android SDK, không có key). iOS chỉ có hướng dẫn, chưa kiểm chứng.

## Maps key không phải bí mật

Key nằm trong APK/IPA và có thể bị trích xuất. Bảo vệ bằng **giới hạn**, không bằng che giấu:

1. Google Cloud Console → APIs & Services → Credentials → tạo **2 key riêng** (Android, iOS).
2. **Application restrictions**
   - Android key: *Android apps* → package `vn.edu.thuyetminh` + SHA-1 của chứng chỉ ký (debug: `keytool -list -v -keystore apps/mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`; release/Play App Signing: lấy SHA-1 trong Play Console).
   - iOS key: *iOS apps* → bundle ID của app.
3. **API restrictions**: chỉ cho phép *Maps SDK for Android* / *Maps SDK for iOS*.
4. Đặt hạn mức (quota) và cảnh báo billing.

## Android

`apps/mobile/.env` (không commit):

```
GOOGLE_MAPS_ANDROID_API_KEY=AIza...
```

`android/app/build.gradle` đọc biến này (qua `react-native-config`) vào `manifestPlaceholders.googleMapsApiKey`; `AndroidManifest.xml` khai báo `com.google.android.geo.API_KEY`. Build lại app sau khi đổi `.env`.

Thiếu key → app hiển thị "Bản đồ chưa được cấu hình" và người dùng vẫn chọn POI ở tab Địa điểm.

## Quyền vị trí

- Chỉ xin quyền **foreground** khi người dùng bấm "Vị trí của tôi" (`ACCESS_FINE_LOCATION`/`COARSE`).
- Từ chối → thông báo, vẫn chọn POI thủ công.
- Không khai báo/xin `ACCESS_BACKGROUND_LOCATION`; MVP không thu thập vị trí nền.

## iOS (chưa kiểm chứng — cần macOS)

1. `Info.plist` đã có `NSLocationWhenInUseUsageDescription`.
2. Google Maps trên iOS cần SDK Google Maps cho iOS. Theo tài liệu `react-native-maps` (mục *Enabling Google Maps on iOS*):
   - thêm pod `react-native-maps/Google` (hoặc theo hướng dẫn phiên bản đang dùng) vào `ios/Podfile`, chạy `cd ios && bundle install && bundle exec pod install`;
   - trong `AppDelegate.swift` gọi `GMSServices.provideAPIKey(...)` trước khi khởi tạo React Native, đọc key từ `Info.plist`/`react-native-config` (không hard-code).
3. Nếu chưa cấu hình Google cho iOS, có thể tạm dùng Apple Maps bằng cách bỏ `provider={PROVIDER_GOOGLE}` trên iOS (thay đổi sản phẩm — cần nhóm quyết định).

Google Maps **không** hoạt động offline trong MVP; ứng dụng không tuyên bố điều đó.
