# Kiến trúc Backend

## Hướng tổ chức

Backend tiếp tục là một ứng dụng Spring Boot nguyên khối, tổ chức theo miền nghiệp vụ. Không tách microservice và không thêm framework kiến trúc chỉ để tạo thêm lớp trung gian.

- **HTTP adapters**: controller và adapter chuyển kiểu HTTP sang hợp đồng trung lập với framework. Chỉ lớp này nhận `MultipartFile`.
- **Application services**: điều phối ca sử dụng, kiểm tra quy tắc nghiệp vụ và giao dịch. Ví dụ `PoiAdminService` (ghi), `PoiAdminQueryService` (đọc), `PoiMediaService`, `PoiPublicService`, `AudioService` và `TtsJobService`.
- **Domain model**: quy tắc trạng thái và hành vi thực thể như `Poi`, `PoiTranslation`, `AudioAsset` và `AudioGenerationJob`.
- **Persistence**: Spring Data repositories, entity mapping JPA và Flyway migrations.
- **Outbound ports/adapters**: `MediaStorage` và `TtsProvider` là các điểm thay thế cho lưu trữ media và nhà cung cấp TTS.

## Quy tắc phụ thuộc

1. Controller chỉ xử lý HTTP, xác thực đầu vào ở biên và gọi application service; không tự chứa quy tắc nghiệp vụ.
2. Application service không nhận kiểu transport như `MultipartFile`. Hợp đồng `UploadedFile` được khai báo trong phần media; `MultipartUploadedFile` chuyển đổi ở adapter web.
3. Dùng constructor injection; không dùng field injection hoặc service locator.
4. Tạo interface khi nó là ranh giới thay thế/kiểm thử thực sự, không tạo interface một triển khai chỉ để nhân số lớp.
5. Giữ transaction tại thao tác nghiệp vụ cần tính nguyên tử; không bao quanh lời gọi TTS bên ngoài bằng transaction cơ sở dữ liệu.
6. Giữ nguyên hợp đồng API, mã lỗi, quy tắc RBAC và quy tắc phiên bản audio khi tái cấu trúc.
7. Không thêm chức năng xuất báo cáo; Audit Log toàn hệ thống chỉ dành cho Super Admin theo quy tắc nghiệp vụ đã chốt.

## Trạng thái và giới hạn hiện tại

Đợt chuẩn hóa đầu tiên đã tách truy vấn Admin sang `PoiAdminQueryService`, thao tác ảnh/âm thanh sang `PoiMediaService` và loại bỏ phụ thuộc `MultipartFile` khỏi các application service liên quan. Đây là bước chuyển tiếp, chưa phải Clean Architecture thuần: application services vẫn dùng Spring transaction annotations và Spring Data repositories; entity vẫn là JPA entity. Chỉ tách tiếp các port persistence/domain thuần khi có thể làm theo từng miền, có kiểm thử bảo vệ và không phải tạo các abstraction rỗng.

## Kiểm tra

Chạy unit tests từ thư mục `services/backend`:

```powershell
.\mvnw.cmd clean test
```

Integration tests có hậu tố `*IT.java` chạy qua `verify` và cần môi trường PostgreSQL được cấu hình theo README.
