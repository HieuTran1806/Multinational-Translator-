# Triển khai miễn phí an toàn: Botkeep + Cloudflare Pages

Tài liệu chuẩn bị triển khai, **không phải bằng chứng rằng dịch vụ đã được tạo hoặc website đã được public**. Mục tiêu là 0 USD, không nhập thẻ thanh toán, không mua domain. Chỉ tiếp tục nếu dashboard của từng nhà cung cấp xác nhận thao tác vẫn nằm trong free tier và không yêu cầu bật billing.

## Kiến trúc mục tiêu

- apps/web: Cloudflare Pages static site.
- apps/admin: Cloudflare Pages static site riêng.
- services/backend: Docker workload trên Botkeep, build từ services/backend/Dockerfile.
- PostgreSQL: workload riêng trên Botkeep nếu free quota hiện hành cho phép.
- HTTPS và subdomain do nhà cung cấp cấp; không cần domain riêng.

**Chưa xác minh:** quota hiện hành trong tài khoản Botkeep, quyền dùng persistent volume ở free tier, khả năng backup/restore database, và điều kiện không yêu cầu thẻ. Không tạo workload cho đến khi kiểm tra được các mục này.

## Cloudflare Pages — cấu hình cho từng app

Tạo hai Pages project riêng từ cùng repository:

| Thiết lập | User web | Admin |
|---|---|---|
| Root directory | apps/web | apps/admin |
| Build command | npm run build:production | npm run build:production |
| Build output directory | dist | dist |
| Runtime | Node.js 22 | Node.js 22 |
| VITE_API_BASE_URL | URL HTTPS backend thực tế | URL HTTPS backend thực tế |
| VITE_USE_MOCK | false | false |

Build script kiểm tra URL API tuyệt đối qua HTTPS, từ chối localhost và từ chối bật mock. Cấu hình này được nhúng vào bundle frontend nên URL API không phải bí mật; **không đặt password, token hay secret vào biến VITE_***.

Các file public/_redirects giữ SPA route hoạt động khi tải trực tiếp hoặc refresh URL con. public/_headers bật các header bảo vệ trình duyệt; Web giữ quyền camera để quét QR, Admin không cần camera. Sau khi tạo site, ghi lại chính xác hai origin https://<project>.pages.dev.

## Botkeep — backend và PostgreSQL

### Backend

- Build context: services/backend.
- Dockerfile: services/backend/Dockerfile.
- Health check: /actuator/health/readiness.
- Profile: prod.
- PORT: dùng port mà nền tảng cấp; không hardcode cổng public.
- Không deploy infra/docker-compose.yml như production stack; Compose chỉ phục vụ local.
- Không bật Swagger/API docs trên Internet.

Biến môi trường backend bắt buộc:

| Biến | Giá trị |
|---|---|
| SPRING_PROFILES_ACTIVE | prod |
| PORT | Port được nền tảng cấp (nếu yêu cầu) |
| DB_URL | JDBC URL của PostgreSQL |
| DB_USERNAME | DB user riêng cho ứng dụng |
| DB_PASSWORD | Secret mạnh, chỉ đặt trong secret manager/dashboard |
| APP_CORS_ALLOWED_ORIGINS | Hai origin HTTPS chính xác của Web và Admin, phân cách bằng dấu phẩy |
| APP_ACCESS_ACTIVATION_URL | https://<web-pages-domain>/activate |
| APP_API_DOCS_ENABLED | false |
| APP_BOOTSTRAP_ADMIN_ENABLED | true chỉ trong lần khởi tạo tài khoản đầu tiên; sau đó đặt false |
| APP_BOOTSTRAP_ADMIN_USERNAME | Tên tài khoản chủ dự án |
| APP_BOOTSTRAP_ADMIN_PASSWORD | Mật khẩu mạnh tối thiểu 12 ký tự; không dùng lại ở dịch vụ khác |
| APP_BOOTSTRAP_ADMIN_ROLE | ADMIN để chủ dự án quản lý POI/media; SUPER_ADMIN chỉ cho quản trị tài khoản/RBAC/audit |
| APP_STORAGE_LOCAL_ROOT | /app/data/media chỉ khi persistent storage đã được xác nhận |

Không copy giá trị mẫu vào dashboard nếu chưa thay bằng URL/secret thực tế. Sau khi tài khoản được tạo, tắt bootstrap, xóa password bootstrap khỏi cấu hình và restart/redeploy có kiểm soát. Bootstrap không đổi mật khẩu nếu username đã tồn tại.

### PostgreSQL

- Tạo database mới, chỉ dành cho demo; không trỏ về database local hoặc dữ liệu thật.
- Chỉ cho backend truy cập qua private networking nếu được hỗ trợ.
- Không public PostgreSQL port ra Internet.
- Đảm bảo database có backup/export tải được mà không cần nâng cấp trả phí.
- Flyway production chỉ chạy classpath:db/migration; **không bật profile dev và không nạp db/demo**, vì thư mục đó có tài khoản và QR demo đã biết trước.
- Sau migration, kiểm tra phương án khởi tạo dữ liệu demo và tài khoản chủ dự án trước khi mở public.

## Hard gate: quyền quản trị và media

### Tài khoản chủ dự án

Ứng dụng phân biệt ADMIN (quản lý POI/media) và SUPER_ADMIN (quản lý tài khoản/RBAC/audit; không có quyền quản lý POI). Đã bổ sung APP_BOOTSTRAP_ADMIN_ROLE để tạo đúng vai trò tài khoản đầu tiên mà không nới lỏng phân quyền: đặt ADMIN cho tài khoản chủ dự án cần biên tập nội dung; giữ SUPER_ADMIN khi mục tiêu là quản trị tài khoản. Chỉ bootstrap một lần rồi tắt cờ.

### Ảnh/audio

LocalMediaStorage lưu file trên filesystem. Chỉ được public tính năng upload/chỉnh sửa media sau khi xác minh Botkeep hỗ trợ persistent volume trên free tier và đã test restart/redeploy. Nếu không có persistence miễn phí, **dừng tại đây**; không tuyên bố media được giữ và không dùng filesystem tạm cho nội dung cần giữ. Không chuyển sang dịch vụ tính phí hoặc yêu cầu nhập thẻ nếu mục tiêu 0 USD là bắt buộc.

Các WAV demo hiện là âm thanh tone, không phải giọng thuyết minh. Placeholder PNG 1×1 cũng không phải ảnh nội dung. Không giới thiệu chúng như media thật.

## Trình tự phát hành

1. Kiểm tra quota/điều khoản free tier, yêu cầu thẻ và persistence trong dashboard; chưa tạo workload nếu có điều kiện không phù hợp.
2. Chạy lint, test, build production guard và backend tests trên source đã được review.
3. Tạo PostgreSQL demo, chạy migration production, xác minh backup/export.
4. Tạo backend workload, cấu hình secrets, health check, profile và CORS.
5. Xác minh tài khoản owner ADMIN có thể đăng nhập, chỉ đúng quyền và có quy trình tắt bootstrap.
6. Chỉ tiếp tục upload media sau khi persistence được chứng minh bằng test ghi file → restart/redeploy → đọc lại cùng file.
7. Tạo hai Pages site, cấu hình API HTTPS và kiểm tra redirect/header.
8. Chạy smoke test: login, quyền ADMIN/SUPER_ADMIN, POI, QR redeem/grant, ảnh/audio, API không có grant, CORS, deep link và health.
9. Tải backup database và media; thực hiện restore vào môi trường sạch và xác minh.
10. Public URL chỉ sau khi các gate trên PASS; ghi lại rollback steps và quota hiện tại.

## Checklist nghiệm thu trước khi public

- [ ] Xác nhận free tier thật sự là 0 USD và không cần thẻ/billing.
- [ ] Xác nhận quota đủ cho 2 frontend + backend + PostgreSQL.
- [ ] HTTPS hoạt động cho hai frontend và API.
- [ ] Production build dùng API HTTPS, mock tắt.
- [ ] Chỉ origin đã biết được phép CORS.
- [ ] Production không nạp demo admin accounts hoặc QR token có sẵn.
- [ ] Tài khoản owner được tạo an toàn, bootstrap đã tắt.
- [ ] SUPER_ADMIN không có quyền quản lý POI; ADMIN chỉ có quyền cần thiết.
- [ ] Media sống qua restart/redeploy hoặc tính năng upload bị khóa/chưa public.
- [ ] Backup database/media có thể restore đã được kiểm thử.
- [ ] Smoke tests và kiểm tra quyền truy cập đều PASS.
- [ ] Không có secret trong Git, bundle frontend hoặc log.
- [ ] Có hướng dẫn rollback và giới hạn tài nguyên/chi phí được ghi nhận.

## Rollback

- Pages: khôi phục deployment artifact trước đó từ dashboard.
- Backend: redeploy image/revision đã kiểm chứng trước đó.
- Database: không tự động chạy migration ngược; restore backup chỉ theo kế hoạch đã thử nghiệm.
- Media: khôi phục từ backup tương ứng với database.
- Không reset database, xóa media hay đổi schema tự động khi rollback.
