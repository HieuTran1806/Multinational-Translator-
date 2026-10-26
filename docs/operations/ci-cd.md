# CI/CD — Multitional Translator

## Trạng thái

- **CI đang được cấu hình:** GitHub Actions workflow `/.github/workflows/ci.yml`.
- **CD chưa kích hoạt:** không có workflow nào tự triển khai lên staging hoặc production. Các tệp trong `cd-templates/` chỉ là mẫu tham khảo.
- **Mobile CI/CD:** chưa có trong workflow vì ứng dụng mobile chưa nằm trong nhánh hiện tại.

## Quy trình CI

Workflow chạy khi push lên bất kỳ branch nào và khi mở/cập nhật Pull Request. Các job độc lập:

| Job | Kiểm tra |
|---|---|
| Contract documentation | Tài liệu baseline bắt buộc tồn tại; `git diff --check` |
| Backend unit tests | Java 21 + Maven Wrapper, `./mvnw clean test` |
| Admin quality checks | Node.js 22, `npm ci`, `npm run lint`, `npm test`, `npm run build` |
| Web quality checks | Node.js 22, `npm ci`, `npm run lint`, `npm test`, `npm run build` (`apps/web`) |

CI không cần credentials của production. Dependencies được cài từ lockfile/wrapper; job có timeout, quyền `contents: read` và concurrency cancellation.

### Các kiểm tra hiện chưa chạy trong CI

- Backend integration tests (`mvnw verify`) cần PostgreSQL và database test riêng.
- Admin end-to-end (`npm run verify:e2e`) cần backend, database và tài khoản kiểm thử.
- Kiểm thử credentials thật của Google Cloud Text-to-Speech.
- Deployment, smoke test sau deploy, backup/restore và kiểm thử thiết bị mobile.

Không báo cáo những kiểm tra này là PASS chỉ dựa vào CI hiện tại. Trước khi thêm integration test vào CI, hãy dùng service PostgreSQL riêng cho từng run, cung cấp cấu hình test qua biến môi trường, không tái sử dụng dữ liệu local/production.

## Quy trình đề xuất cho nhóm

1. Tạo branch theo công việc; không commit trực tiếp lên `main`.
2. Mở Pull Request nhỏ, mô tả thay đổi và cách kiểm thử.
3. Chờ tất cả CI checks thành công; review thay đổi API/schema và bảo mật.
4. Chỉ merge khi đã review và các checks bắt buộc đạt.
5. Sau khi merge, CD chỉ được bật khi đã chọn nhà cung cấp, thiết lập secrets/environments và xác minh rollback/smoke tests.

## Thiết lập bảo vệ nhánh GitHub

Trong **Settings → Rules → Rulesets** (hoặc Branches/branch protection), cấu hình cho `main`:

- Bắt buộc Pull Request.
- Bắt buộc các status checks từ workflow CI thành công.
- Chặn force push và xóa nhánh.
- Yêu cầu review ít nhất một người nếu quy mô nhóm cho phép.

Tên check có thể thay đổi theo tên job trong workflow. Chạy workflow ít nhất một lần để GitHub hiển thị check names rồi chọn đúng các checks.

## Bảo mật workflow

- Giữ quyền token tối thiểu; không cấp `contents: write` cho CI thông thường.
- Không cung cấp secrets cho workflow chạy code từ fork/PR không đáng tin cậy.
- Không dùng dữ liệu production trong unit/integration test.
- Không ghi token, mật khẩu hoặc nội dung service-account vào log.
- Khi thay đổi GitHub Actions, kiểm tra phiên bản, quyền và nguồn của action; với môi trường yêu cầu kiểm soát supply chain nghiêm ngặt, pin action theo commit SHA đã xác minh.
- Không lưu bí mật trong `VITE_*`: các biến này được nhúng vào bundle frontend.

## CD / triển khai

Chưa có deployment tự động. Xem [deployment.md](deployment.md) để tham khảo cấu hình Vercel cho Admin và Render/VPS/Docker cho backend. Chọn duy nhất một cơ chế triển khai (hosting tự deploy hoặc GitHub Actions) để tránh triển khai hai lần.

Trước khi bật CD cần hoàn tất tối thiểu:

- Hosting và domain đã chọn, HTTPS hoạt động.
- Secrets nằm trong hosting/GitHub Environments, không nằm trong repository.
- PostgreSQL production có backup và kế hoạch khôi phục.
- Media lưu tại volume/bucket bền vững.
- CORS chỉ cho phép origin Admin hợp lệ.
- Health/smoke test sau deploy và quy trình rollback.
- Environment production có bảo vệ/phê duyệt; không deploy từ pull request.
