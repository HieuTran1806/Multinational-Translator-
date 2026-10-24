# Kiến trúc Backend

## Hướng tổ chức

Backend tiếp tục là một ứng dụng Spring Boot nguyên khối, tổ chức theo miền nghiệp vụ. Không tách microservice và không thêm framework kiến trúc chỉ để tạo thêm lớp trung gian.

- **HTTP adapters**: controller và adapter chuyển kiểu HTTP sang hợp đồng trung lập với framework. Chỉ lớp này nhận `MultipartFile`.
- **Application services**: điều phối ca sử dụng, kiểm tra quy tắc nghiệp vụ và giao dịch. Ví dụ `PoiAdminService` (ghi), `PoiAdminQueryService` (đọc), `PoiMediaService`, `PoiPublicService`, `AudioService` và `TtsJobService`.
- **Domain model**: quy tắc trạng thái và hành vi thực thể như `Poi`, `PoiTranslation`, `AudioAsset` và `AudioGenerationJob`.
- **Persistence**: Spring Data repositories, entity mapping JPA và Flyway migrations. Application service POI không dùng trực tiếp Spring Data: chúng phụ thuộc port `PoiStore`, `PoiTranslationStore` và `PoiImageStore`, còn `poi/persistence/JpaPoiStore`, `JpaPoiTranslationStore` và `JpaPoiImageStore` là các adapter duy nhất biết `PoiRepository`/`PoiTranslationRepository`/`PoiImageRepository`, `Page`, `Pageable`, thứ tự sắp xếp và thứ tự flush.
- **Outbound ports/adapters**: `MediaStorage` và `TtsProvider` là các điểm thay thế cho lưu trữ media và nhà cung cấp TTS; `PoiStore`, `PoiTranslationStore` và `PoiImageStore` là port persistence của POI, bản dịch và ảnh.

## Quy tắc phụ thuộc

1. Controller chỉ xử lý HTTP, xác thực đầu vào ở biên và gọi application service; không tự chứa quy tắc nghiệp vụ.
2. Application service không nhận kiểu transport như `MultipartFile`. Hợp đồng `UploadedFile` được khai báo trong phần media; `MultipartUploadedFile` chuyển đổi ở adapter web.
3. Dùng constructor injection; không dùng field injection hoặc service locator.
4. Tạo interface khi nó là ranh giới thay thế/kiểm thử thực sự, không tạo interface một triển khai chỉ để nhân số lớp. `PoiStore`, `PoiTranslationStore` và `PoiImageStore` là port persistence: khai báo đúng các thao tác application service đang dùng, gồm cả quy tắc "POI đã xóa mềm coi như không tồn tại".
5. Application service không import `org.springframework.data.domain.*`; phân trang đi qua `PageResponse` (record trung lập với framework) do adapter dựng từ `Page`.
6. `PageResponse` và `PageRequests` giữ nguyên hình dạng JSON và quy tắc kiểm tra `page`/`size` (`size` 1..100) như trước refactor.
7. Giữ transaction tại thao tác nghiệp vụ cần tính nguyên tử; không bao quanh lời gọi TTS bên ngoài bằng transaction cơ sở dữ liệu.
8. Giữ nguyên hợp đồng API, mã lỗi, quy tắc RBAC và quy tắc phiên bản audio khi tái cấu trúc.
9. Không thêm chức năng xuất báo cáo; Audit Log toàn hệ thống chỉ dành cho Super Admin theo quy tắc nghiệp vụ đã chốt.

## Trạng thái và giới hạn hiện tại

Đợt chuẩn hóa đầu tiên đã tách truy vấn Admin sang `PoiAdminQueryService`, thao tác ảnh/âm thanh sang `PoiMediaService` và loại bỏ phụ thuộc `MultipartFile` khỏi các application service liên quan. Đợt thứ hai đã tách ranh giới persistence của aggregate POI: `PoiAdminService`, `PoiAdminQueryService`, `PoiMediaService` và `PoiPublicService` chỉ còn phụ thuộc `PoiStore`, không còn `PoiRepository`, `Page`, `Pageable` hay `Sort`. Đợt thứ ba tách tiếp bản dịch sang `PoiTranslationStore` với hai mức flush được đặt tên rõ (`save` không flush, `saveNow` flush ngay) và giữ nguyên `flush()` cuối `upsertTranslation`. Đợt thứ tư tách ảnh sang `PoiImageStore` sáu thao tác (đọc theo POI và ảnh, đếm, lưu-flush, lưu hàng loạt, xóa); từ đây bốn application service POI (`PoiAdminService`, `PoiAdminQueryService`, `PoiMediaService`, `PoiPublicService`) không còn import hay dùng trực tiếp Spring Data.

## Trạng thái hiện tại và giới hạn

Các application service không truy cập Spring Data repository trực tiếp. Các persistence port/adapters hiện có:

- POI, bản dịch và ảnh: `PoiStore`, `PoiTranslationStore`, `PoiImageStore` cùng adapter JPA.
- Audio: `AudioAssetStore` / `JpaAudioAssetStore`.
- Tài khoản và phiên đăng nhập: `AccountStore`, `AuthSessionStore` cùng adapter JPA.
- Ngôn ngữ: `LanguageStore` / `JpaLanguageStore`.
- TTS jobs: `AudioGenerationJobStore` / `JpaAudioGenerationJobStore`.
- `MediaController` gọi `PublicAudioQueryService` để kiểm tra điều kiện audio công khai; controller không tự truy cập repository.
- `DemoAudioSeeder` dùng các port POI/bản dịch thay vì Spring Data.
- Helper phân trang Spring Data nằm trong package persistence.

`CleanArchitectureBoundaryTest` kiểm tra tự động rằng application service/controller không import Spring Data repository và Spring Data chỉ được tham chiếu từ repository definitions hoặc persistence adapters.

Đây là bước chuẩn hóa dependency boundary, nhưng **chưa phải Clean Architecture thuần hoàn toàn**. Các giới hạn còn lại cần được xử lý ở các đợt tiếp theo:

- Một số model (`Poi`, `PoiTranslation`, `PoiImage`, `AudioAsset`, `Account`, `AuthSession`, `Language`, `AudioGenerationJob`) vẫn mang annotation JPA và đang kiêm domain model/persistence model.
- Application services vẫn dùng annotation/giao dịch của Spring; `TtsJobService` còn phụ thuộc `PlatformTransactionManager`/`TransactionTemplate` để bảo đảm TTS provider chạy ngoài transaction.
- `PoiMediaService.deleteImage` xóa file vật lý trong transaction DB; nếu transaction rollback sau khi xóa file, bản ghi ảnh có thể còn nhưng file đã mất.
- Storage và database chưa có cơ chế bù trừ/cleanup orphan hoàn chỉnh khi một bên thành công còn bên kia thất bại.

Không được tuyên bố kiến trúc đã hoàn toàn thuần cho đến khi persistence model được tách khỏi domain model, transaction boundary được đưa ra adapter phù hợp và các hành vi đó có test bảo vệ. Refactor phải giữ nguyên API, mã lỗi, RBAC, optimistic locking, thứ tự flush và quy tắc phiên bản audio.
## Kiểm tra

Chạy unit tests từ thư mục `services/backend`:

```powershell
.\mvnw.cmd clean test
```

Integration tests có hậu tố `*IT.java` chạy qua `verify` và cần môi trường PostgreSQL được cấu hình theo README.
