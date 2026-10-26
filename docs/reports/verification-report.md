# Báo cáo kiểm chứng (2026-10-13)

> **Cập nhật 2026-10-24:** `apps/mobile` đã bị loại bỏ có chủ đích; dự án hiện web-only. Các dòng kết quả `apps/mobile` bên dưới chỉ còn giá trị lịch sử (chạy trên nhánh cũ trước khi loại bỏ), không áp dụng cho nhánh hiện tại.

Môi trường phát triển: Linux container, JDK 21.0.12, Maven 3.9.11, Node 22.22.0 / npm 10.9.4, PostgreSQL 16.15, Docker 29.8.2. **Không có** Android SDK, macOS/Xcode, thiết bị thật, thông tin xác thực Google Cloud hay khóa API Maps.

**Giới hạn mạng của môi trường:** chính sách egress chặn `repo.maven.apache.org`, `maven.google.com`, `dl.google.com`, `services.gradle.org`, `registry-1.docker.io` (HTTP 403). Chỉ npm registry và GitHub truy cập được. Hệ quả: **không tải được dependency Maven, Docker image hay Gradle/Android SDK** → backend chưa được biên dịch/test, Docker image và APK chưa được build.

## Các kiểm tra đã chạy và đạt

| Lệnh | Kết quả |
|---|---|
| `apps/admin`: `npm ci` (npm 10, từ lockfile) | OK, không phát hiện lỗ hổng |
| `apps/admin`: `npm run lint` | OK (0 lỗi) |
| `apps/admin`: `npm test` (Vitest) | **14/14 kiểm thử đạt** (4 file) |
| `apps/admin`: `npm run build` (Vite) | OK (JS 260 KB, gzip 83 KB) |
| `apps/mobile`: `npm ci` | OK, `patch-package` áp dụng `react-native-tts+4.1.1.patch` |
| `apps/mobile`: `npm run lint` | OK |
| `apps/mobile`: `npm run typecheck` (`tsc --noEmit`) | OK |
| `apps/mobile`: `npm test` (Jest) | **26/26 kiểm thử đạt** (5 suite) |
| `apps/mobile`: `npx react-native bundle --platform android --dev false` | OK — JS bundle Android 1.4 MB được tạo (mọi import JS phân giải được) |
| Migration `V1`, `V2`, `db/demo/V100` chạy bằng `psql -v ON_ERROR_STOP=1` trên PostgreSQL 16 | OK; dữ liệu demo: 2 POI công khai × 2 ngôn ngữ + 1 POI nháp; CHECK toạ độ chặn latitude 95 |
| `javac` không có dependency (kiểm tra cú pháp + tham chiếu nội bộ) | Không có lỗi cú pháp; mọi lỗi còn lại chỉ là thiếu thư viện ngoài (Spring, JPA, JUnit…) hoặc phương thức kế thừa từ `JpaRepository` |
| `docker compose -f infra/docker-compose.yml config` | OK (cú pháp hợp lệ) |
| `.github/workflows/ci.yml` parse YAML | OK |
| uuét bí mật (regex key Google, private key, mật khẩu) | Không phát hiện (chỉ placeholder `change-me…`, mật khẩu CI/test giả) |

## Chưa kiểm chứng (và lý do)

| Hạng mục | Lý do | Cách kiểm chứng |
|---|---|---|
| Backend biên dịch, unit test, integration test (`./mvnw verify`) | Maven Central bị chặn | Chạy `./mvnw verify` trên máy nhóm hoặc job `backend` của CI |
| Spring context khởi động thật, Hibernate `validate` khớp schema | như trên | như trên |
| Docker image backend, `docker compose up` | Docker Hub bị chặn | `docker compose ... up --build` |
| Gọi Google Cloud TTS thật | Không có credentials | Làm theo `google-tts.md`, gọi `POST .../tts` |
| Android debug build (`./gradlew assembleDebug`) | Không có Android SDK; Google Maven/Gradle bị chặn | Android Studio hoặc job `mobile-android` |
| `react-native-tts` 4.1.1 (đã vá Gradle) chạy qua interop New Architecture | Chưa biên dịch phần mã native | Biên dịch và thử trên thiết bị |
| Google Maps hiển thị, quyền vị trí | Không có SDK/thiết bị/key | Thiết bị thật + key đã giới hạn |
| Phát audio thật (react-native-sound), SQLite/FS thật trên thiết bị | Không có thiết bị | Kịch bản thủ công trong `mobile.md` |
| iOS (pod install, Google Maps iOS, TTS iOS) | Không có macOS | Máy Mac |
| GitHub Actions chạy thật | Chưa push lên GitHub | Đẩy nhánh, mở PR và theo dõi lần chạy đầu |
| Bảo vệ nhánh | Chỉ có hướng dẫn | Bật theo `ci-cd.md` |

## Rủi ro cần lưu ý khi chạy lần đầu

1. **Backend chưa từng được biên dịch.** Mã viết cho Spring Boot 4.1 / Spring Security 7 / Hibernate 7 / Jackson 3; đã tránh các API có thay đổi lớn (MockMvc dựng thủ công, không dùng `ObjectMapper` trực tiếp). Nếu có lỗi biên dịch, đó thường là lỗi nhỏ về package/tên API — sửa theo thông báo của `./mvnw`.
2. `react-native-tts` không còn được bảo trì; nếu interop lỗi trên RN 0.87, cân nhắc thay thư viện TTS thiết bị (phải giữ hành vi chọn giọng hiện có).
3. Lockfile admin được tạo bằng npm 11 (npm 10.9.4 gặp lỗi nội bộ `edgesOut` khi cài `vitest`), nhưng `npm ci` với npm 10 chạy tốt.
4. Maven Wrapper chưa có `distributionSha256Sum` (không tải được bản phân phối để tính checksum).
## Cập nhật tài liệu nghiệp vụ — 2026-10-21

- Đã đồng bộ tài liệu về ứng dụng User React Native online-only, QR riêng cho từng khách hàng, kích hoạt một lần, quyền 24 giờ gắn với thiết bị và khôi phục phiên chỉ trên thiết bị đã kích hoạt.
- Đã ghi nhận RBAC: Super Admin quản lý Admin/RBAC và xem Audit Log nhưng không quản lý POI hoặc Seller; Admin quản lý POI/nội dung/audio và Seller; chỉ Super Admin xem Audit Log toàn hệ thống.
- Đã loại bỏ yêu cầu xuất báo cáo khỏi phạm vi; dashboard chỉ xem/lọc.
- Đây chỉ là cập nhật tài liệu; không sửa mã nguồn và không chạy lại kiểm thử ứng dụng. Quy tắc RBAC/QR cần được triển khai và kiểm chứng riêng; chưa được xem là đã được enforce trong thời gian chạy.
- Quyết định còn mở: tác nhân tạo/cấp QR riêng cho khách hàng và chính sách hết hạn của QR chưa kích hoạt.
