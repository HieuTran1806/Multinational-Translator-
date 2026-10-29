# Kiểm thử

Bảng này mô tả kiểm thử có trong repository; việc có test không đồng nghĩa test đã chạy trong lượt hiện tại.

| Phạm vi | Test hiện có |
|---|---|
| Security/session | `SecurityIT`, `SecurityConfigTest` (nếu có trong nhánh), `BootstrapAdminRunnerTest` |
| POI/content/media | `PoiFlowIT`, `PoiAdminServiceTest`, `PoiTranslationTest`, `PoiMediaServiceTest` |
| QR/grant | `AccessFlowIT`, `AccessGrantServiceTest`, `AccessQrAdminServiceTest` |
| Analytics | `AnalyticsFlowIT`, `AnalyticsServiceTest` |
| Admin account | `AdminAccountFlowIT`, `AdminAccountServiceTest` |
| Audit | `AuditFlowIT`, `AuditServiceTest` |
| Admin UI | Vitest tests dưới `apps/admin/src` |
| User UI | Vitest tests dưới `apps/web/src` |

## Ma trận kiểm tra quyền bắt buộc

| Actor | Endpoint | Kết quả |
|---|---|---|
| ADMIN | `/api/v1/admin/analytics/**` | Cho phép |
| SUPER_ADMIN | `/api/v1/admin/analytics/**` | 403 |
| SUPER_ADMIN | `/api/v1/admin/pois/**`, media, QR | 403 |
| ADMIN | `/api/v1/admin/accounts/**`, `/api/v1/admin/audit/**` | 403 |
| SUPER_ADMIN | `/api/v1/admin/accounts/**`, `/api/v1/admin/audit/**` | Cho phép |
| Bất kỳ actor không phù hợp | Seller API | Không còn nghiệp vụ; route bị từ chối |
| User | QR hợp lệ, public POI/audio theo grant | Tiếp tục hoạt động |

Chạy backend từ `services/backend`: `./mvnw test`; kiểm thử tích hợp cần PostgreSQL test riêng qua `TEST_DB_URL`. Không bao giờ trỏ test vào production. Web apps: `npm test`, `npm run lint`, `npm run build` trong từng thư mục `apps/admin` và `apps/web`.

Không tạo test mới trong nhiệm vụ loại bỏ Seller; sửa hoặc loại bỏ test Seller cũ để suite phản ánh nghiệp vụ hiện hành. Chỉ ghi test PASS sau khi có output thật.
