# Google Maps trên ứng dụng di động

Thư viện sử dụng: `react-native-maps` 1.29.11 với `PROVIDER_GOOGLE`.

**Trạng thái:** cấu hình Android đã thêm (meta-data khóa API qua `manifestPlaceholders`), **chưa build/chạy thử** trong môi trường phát triển (không có Android SDK, không có khóa API). iOS chỉ có hướng dẫn, chưa kiểm chứng.

## Khóa API Maps không phải là bí mật

Khóa được đóng gói trong APK/IPA và có thể bị trích xuất. Hãy bảo vệ bằng **giới hạn sử dụng**, không phải bằng cách che giấu:

1. Google Cloud Console → APIs & Services → Credentials → tạo **hai khóa riêng biệt** (Android, iOS).
2. **Giới hạn ứng dụng**
   - Khóa Android: *Android apps* → gói ứng dụng `vn.edu.thuyetminh` + SHA-1 của chứng chỉ ký (gỡ lỗi: `keytool -list -v -keystore apps/mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`; phát hành/Play App Signing: lấy SHA-1 trong Play Console).
   - Khóa iOS: *iOS apps* → mã định danh bundle của app.
3. **Giới hạn API**: chỉ cho phép *Maps SDK for Android* / *Maps SDK for iOS*.
4. Đặt hạn mức sử dụng và cấu hình cảnh báo thanh toán.

## Android

`apps/mobile/.env` (không commit):

```
GOOGLE_MAPS_ANDROID_API_KEY=AIza...
```

`android/app/build.gradle` đọc biến này (qua `react-native-config`) vào `manifestPlaceholders.googleMapsApiKey`; `AndroidManifest.xml` khai báo `com.google.android.geo.API_KEY`. Biên dịch lại ứng dụng sau khi thay đổi `.env`.

Thiếu khóa API → ứng dụng hiển thị "Bản đồ chưa được cấu hình" và người dùng vẫn chọn POI ở tab Địa điểm.

## Quyền truy cập vị trí

- Chỉ xin quyền **khi ứng dụng đang ở phía trước** khi người dùng bấm "Vị trí của tôi" (`ACCESS_FINE_LOCATION`/`COARSE`).
- Từ chối → thông báo, vẫn chọn POI thủ công.
- Không khai báo/xin `ACCESS_BACKGROUND_LOCATION`; MVP không thu thập vị trí khi ứng dụng chạy nền.

## iOS (chưa kiểm chứng — cần macOS)

1. `Info.plist` đã có `NSLocationWhenInUseUsageDescription`.
2. Google Maps trên iOS cần SDK Google Maps cho iOS. Theo tài liệu `react-native-maps` (mục *Enabling Google Maps on iOS*):
   - thêm pod `react-native-maps/Google` (hoặc theo hướng dẫn phiên bản đang dùng) vào `ios/Podfile`, chạy `cd ios && bundle install && bundle exec pod install`;
   - trong `AppDelegate.swift` gọi `GMSServices.provideAPIKey(...)` trước khi khởi tạo React Native, đọc key từ `Info.plist`/`react-native-config` (không ghi cứng trong mã nguồn).
3. Nếu chưa cấu hình Google cho iOS, có thể tạm dùng Apple Maps bằng cách bỏ `provider={PROVIDER_GOOGLE}` trên iOS (thay đổi sản phẩm — cần nhóm quyết định).

Google Maps **không** hoạt động ngoại tuyến trong MVP; ứng dụng không tuyên bố có tính năng này.
