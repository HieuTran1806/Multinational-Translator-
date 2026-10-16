# CI/CD

## CI — `.github/workflows/ci.yml`

Chạy khi có pull request và khi push vào `main`. **Chỉ kiểm tra và build, không deploy.**

| Job | Bước |
|---|---|
| `backend` | JDK 21 (Temurin) + cache Maven → `./mvnw -B verify`: unit test (surefire) + integration test (failsafe) với service container PostgreSQL 16. Flyway chạy toàn bộ migration lên DB trống, Hibernate `validate` kiểm tra entity khớp schema. Upload JAR; upload báo cáo test khi lỗi |
| `backend-docker` | Build image từ `services/backend/Dockerfile` bằng Buildx (không push), cache GHA |
| `admin` | `npm ci` → lint → vitest → `vite build` → upload `dist` |
| `mobile-js` | `npm ci` (áp dụng patch) → ESLint → `tsc --noEmit` → Jest |
| `mobile-android` | (sau `mobile-js`) JDK 17 + Gradle cache → `./gradlew assembleDebug` (2 ABI) → upload APK debug. Timeout 60 phút |

Nguyên tắc đã áp dụng:

- `permissions: contents: read`; không dùng secret; không phụ thuộc Google Cloud hay DB production (TTS dùng provider giả lập trong test).
- Không dùng `pull_request_target`; không có `continue-on-error`.
- `concurrency` huỷ lần chạy cũ của cùng nhánh; mỗi job có `timeout-minutes`.
- Action được ghim theo tag phiên bản cụ thể (ví dụ `actions/checkout@v7.0.1`). Có thể tăng cường bằng cách ghim theo commit SHA (Dependabot/Renovate hỗ trợ cập nhật).

> **Chưa chạy trên GitHub.** File YAML đã được kiểm tra cú pháp; các bước tương ứng đã chạy cục bộ ở mức có thể (xem `verification-report.md`). Lần chạy đầu tiên trên GitHub cần được theo dõi.

## Bật branch protection (nhóm tự làm — chưa được bật)

GitHub → Settings → Branches (hoặc Rules → Rulesets) → nhánh `main`:

1. *Require a pull request before merging* (≥ 1 review).
2. *Require status checks to pass* → chọn sau khi CI đã chạy ít nhất một lần:
   `Backend (Java 21 / Maven)`, `Backend Docker image builds`, `Web admin (lint, test, build)`, `Mobile (lint, typecheck, unit tests)`, `Mobile Android debug APK`.
3. *Require branches to be up to date before merging*.
4. *Block force pushes*, không cho xoá nhánh.

## CD — chưa kích hoạt

Mẫu nằm ở `docs/operations/cd-templates/` (cố ý không đặt trong `.github/workflows/`):

- `deploy-backend-render.yml`: chạy bằng `workflow_run` **chỉ khi CI thành công** trên `main` (sự kiện push), gọi Render Deploy Hook (secret `RENDER_DEPLOY_HOOK_URL`).
- `deploy-admin-vercel.yml`: checkout đúng commit đã qua CI, `vercel build` + `vercel deploy --prebuilt --prod`.

Kích hoạt: tạo hosting + secrets + GitHub Environment `production`, **tắt auto-deploy** phía hosting, rồi copy file vào `.github/workflows/`. Xem `deployment.md` mục 7.

Tóm lại: **CI kiểm tra/build; CD chỉ triển khai khi đã cấu hình hosting và secrets.**
