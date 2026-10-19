# Giới thiệu
Ứng dụng web/mobile giúp **khách du lịch** khám phá địa điểm và **nghe thuyết minh tự động** theo vị trí GPS, hỗ trợ **đa ngôn ngữ**, hoạt động cả **online và offline**. Hệ thống có trang **admin** để quản lý địa điểm và nội dung thuyết minh.

# Thành viên nhóm 
3124560031 - Trần Viết Hiếu
3124410102 - Bạch Xuân Hoài
- 

### 🎯 Mục tiêu
- Tự động phát thuyết minh khi khách đến gần địa điểm (geofencing)
- Hỗ trợ nhiều ngôn ngữ qua Google Cloud TTS
- Hoạt động offline với audio cache sẵn
- CI/CD tự động hóa build & deploy

---

# Tính năng chính

- **Quản lý POI trên Admin:** tạo/sửa địa điểm, tìm kiếm, lọc trạng thái, phân trang và điều chỉnh số bản ghi mỗi trang.
- **Thông tin POI:** mã, tên mặc định, tọa độ GPS, danh mục và bán kính kích hoạt (1–5.000 mét; mặc định 50 mét).
- **Quản lý hình ảnh POI:** tải nhiều ảnh, tối đa 6 ảnh/POI, xóa ảnh và thay đổi thứ tự; ảnh đầu tiên là ảnh đại diện.
- **Xuất bản có điều kiện:** yêu cầu nội dung tiếng Anh và audio tiếng Anh hiện hành ở trạng thái sẵn sàng.
- **Xóa mềm POI:** ẩn POI khỏi danh sách và luồng công khai nhưng giữ lại bản ghi cùng dữ liệu liên quan.
- **Thuyết minh đa ngôn ngữ:** quản lý bản dịch, audio tải lên hoặc tạo bằng Google Cloud TTS; hỗ trợ nội dung và audio đã tải để dùng offline.
- **Mobile:** khám phá POI, chọn ngôn ngữ và phát audio online/offline theo khả năng hiện có của MVP.

# Demo

### Màn hình chính

### Nghe thuyết minh

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Mobile** | React Native (Expo) + TypeScript |
| **Web Admin** | ReactJS + Vite + TailwindCSS |
| **Backend** | Java 17 + Spring Boot |
| **Database** | PostgreSQL |
| **Bản đồ** | Google Maps SDK / react-native-maps |
| **TTS** | Google Cloud TTS + react-native-tts (offline) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel (web) + Render/VPS (BE) |

---

## Mô tả hệ thống theo 3 mức General -> Specific -> Diagram 
### General 
### Specific 
### Diagram 



## Kiến trúc hệ thống



## Cấu trúc thư mục


-----------------------------------------

# Thuyết minh đa ngôn ngữ — MVP

Ứng dụng hướng dẫn tham quan có thuyết minh nhiều ngôn ngữ, bối cảnh ban đầu là **Địa đạo Củ Chi**.

Luồng MVP: Admin đăng nhập → tạo địa điểm (POI) → nhập nội dung tiếng Việt/tiếng Anh → tải audio lên hoặc tạo bằng Google Cloud TTS → công khai → ứng dụng di động xem POI → chọn ngôn ngữ → phát thuyết minh (online, offline hoặc giọng thiết bị).

> Trạng thái kiểm chứng của từng phần được ghi tại [`docs/reports/verification-report.md`](docs/reports/verification-report.md). Đọc file đó trước khi demo.

## Cấu trúc monorepo

| Thư mục | Nội dung |
|---|---|
| `apps/mobile` | React Native CLI 0.87 + TypeScript (Android trước, iOS chuẩn bị sẵn) |
| `apps/admin` | Web quản trị React (JavaScript) + Vite + Tailwind CSS |
| `services/backend` | Spring Boot 4.1 (Java 21, Maven Wrapper), monolith chia module theo chức năng |
| `infra` | Docker Compose (PostgreSQL + backend + web Admin), script tạo audio demo, fixture |
| `docs` | Kiến trúc, ERD, API, triển khai, CI/CD, Google TTS/Maps, backlog, báo cáo kiểm chứng |
| `.github/workflows` | CI (chỉ kiểm tra/build, không deploy) |

## Yêu cầu môi trường

| Công cụ | Phiên bản | Dùng cho |
|---|---|---|
| JDK | 21 (Temurin khuyến nghị) | backend |
| JDK | 17 | build Android (theo khuyến nghị React Native) |
| Node.js | 22 LTS (≥ 22.11) + npm ≥ 10 | admin, mobile |
| Docker + Docker Compose v2 | mới | PostgreSQL, chạy backend bằng container |
| Android Studio; Android SDK Platform 37 (compileSdk), Build-Tools 37.0.0, NDK 27.1.12297006 — đúng theo `apps/mobile/android/build.gradle` của template RN 0.87 | — | mobile Android |
| macOS + Xcode + CocoaPods | — | mobile iOS (**chưa kiểm chứng**) |

Phiên bản chi tiết và lý do chọn: [`docs/planning/plan-and-assumptions.md`](docs/planning/plan-and-assumptions.md).

## Chạy nhanh (demo không cần Google Cloud)

### 1. Database + backend bằng Docker

```bash
cp infra/.env.example infra/.env
# Sửa infra/.env: đặt POSTGRES_PASSWORD; để tạo admin lần đầu đặt
#   APP_BOOTSTRAP_ADMIN_ENABLED=true, APP_BOOTSTRAP_ADMIN_USERNAME=admin,
#   APP_BOOTSTRAP_ADMIN_PASSWORD=<mật khẩu riêng ≥ 12 ký tự>
docker compose -f infra/docker-compose.yml --env-file infra/.env up --build
```

- Web Admin: <http://localhost:5173>
- Backend health check: <http://localhost:8080/actuator/health>
- Swagger UI (chỉ dev): <http://localhost:8080/swagger-ui.html>
- PostgreSQL chỉ publish trên loopback `127.0.0.1:5432`; backend kết nối qua hostname nội bộ `postgres`.
- Web Admin được build thành static assets và phục vụ bởi Nginx; `VITE_API_BASE_URL` được nhúng vào bundle tại thời điểm build. Nếu đổi URL API, build lại bằng `docker compose ... up --build`.
- Profile `dev` nạp **2 POI demo công khai + 1 POI nháp** (tên có nhãn `[DEMO]`) và gắn **audio demo dạng tiếng bíp** (không phải giọng đọc) để mobile phát được ngay.
- Sau khi admin đã được tạo, đặt lại `APP_BOOTSTRAP_ADMIN_ENABLED=false`.

### 2. Backend không dùng Docker (tuỳ chọn)

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d postgres
cd services/backend
export SPRING_PROFILES_ACTIVE=dev DB_PASSWORD=<như POSTGRES_PASSWORD>
export APP_BOOTSTRAP_ADMIN_ENABLED=true APP_BOOTSTRAP_ADMIN_USERNAME=admin APP_BOOTSTRAP_ADMIN_PASSWORD='<≥12 ký tự>'
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

Biến môi trường đầy đủ: `services/backend/.env.example`.

### 3. Web admin

```bash
cd apps/admin
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8080
npm ci
npm run dev                     # http://localhost:5173
```

### 4. Mobile (Android)

```bash
cd apps/mobile
cp .env.example .env            # tuỳ chọn: API_BASE_URL, GOOGLE_MAPS_ANDROID_API_KEY
npm ci
npm start                       # Metro
npm run android                 # terminal khác, cần emulator hoặc máy thật
```

- **Android emulator**: mặc định gọi `http://10.0.2.2:8080` (địa chỉ máy host).
- **Điện thoại thật**: `localhost` là chính điện thoại. Dùng IP LAN của máy chạy backend, ví dụ `http://192.168.1.20:8080`, đặt trong `.env` (`API_BASE_URL`) hoặc trong app: **Cài đặt → Địa chỉ máy chủ**. Máy và điện thoại phải cùng mạng; firewall phải mở cổng 8080.
- Bản debug cho phép HTTP; bản release yêu cầu HTTPS.
- Chưa có Maps key → tab Bản đồ hiển thị "chưa cấu hình", tab Địa điểm vẫn dùng bình thường.

Chi tiết: [`docs/development/mobile.md`](docs/development/mobile.md).

## Tạo tài khoản admin local

Không có mật khẩu mặc định. Có 2 cách:

1. **Biến môi trường (khuyến nghị)**: `APP_BOOTSTRAP_ADMIN_ENABLED=true` + `APP_BOOTSTRAP_ADMIN_USERNAME` + `APP_BOOTSTRAP_ADMIN_PASSWORD` (≥ 12 ký tự). Khi khởi động, nếu username chưa tồn tại, backend tạo tài khoản `SUPER_ADMIN` với mật khẩu băm BCrypt. Không bao giờ ghi đè mật khẩu cũ. Tắt lại cờ sau khi tạo.
2. **SQL thủ công**: tạo hash BCrypt (ví dụ `htpasswd -bnBC 10 "" '<mật khẩu>' | tr -d ':\n'`) rồi
   `INSERT INTO account (username, password_hash, display_name, role) VALUES ('admin', '<hash>', 'Admin', 'SUPER_ADMIN');`

Production dùng cùng cơ chế với secret của nền tảng hosting, chỉ bật một lần.

## Biến môi trường chính

| Biến | Thành phần | Mô tả |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | backend | `dev` (dữ liệu demo), `test`, `prod`. Docker image mặc định `prod` |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | backend | Kết nối PostgreSQL |
| `APP_CORS_ALLOWED_ORIGINS` | backend | Danh sách origin, phân tách bằng dấu phẩy |
| `APP_AUTH_SESSION_TTL` | backend | Thời hạn phiên đăng nhập (mặc định `8h`) |
| `APP_BOOTSTRAP_ADMIN_*` | backend | Tạo admin đầu tiên (xem trên) |
| `APP_STORAGE_LOCAL_ROOT` | backend | Thư mục lưu audio/ảnh (volume Docker) |
| `APP_TTS_PROVIDER` | backend | `none` (mặc định) hoặc `google` |
| `GOOGLE_APPLICATION_CREDENTIALS` | backend | Đường dẫn file service account (khi `google`) |
| `VITE_API_BASE_URL` | admin | URL backend (public, nhúng vào bundle lúc build Docker) |
| `ADMIN_PORT` | admin | Cổng trên máy host (mặc định `5173`) |
| `API_BASE_URL`, `GOOGLE_MAPS_ANDROID_API_KEY`, `GOOGLE_MAPS_IOS_API_KEY` | mobile | Trong `apps/mobile/.env` (không phải bí mật) |

## Chạy test

```bash
# Backend — unit test (không cần DB)
cd services/backend && ./mvnw test
# Backend — unit + integration test (cần PostgreSQL có DB thuyetminh_test;
# docker compose ở trên tự tạo DB này lần đầu khởi tạo volume)
export TEST_DB_URL=jdbc:postgresql://localhost:5432/thuyetminh_test TEST_DB_USERNAME=thuyetminh TEST_DB_PASSWORD=<POSTGRES_PASSWORD>
./mvnw verify

# Admin
cd apps/admin && npm run lint && npm test && npm run build

# Mobile
cd apps/mobile && npm run lint && npm run typecheck && npm test
cd apps/mobile/android && ./gradlew assembleDebug
```

Những gì các test kiểm tra: [`docs/development/testing.md`](docs/development/testing.md).

## Google Cloud TTS và Google Maps

- TTS (chỉ backend gọi): [`docs/integrations/google-tts.md`](docs/integrations/google-tts.md)
- Maps (Android/iOS, giới hạn key): [`docs/integrations/google-maps.md`](docs/integrations/google-maps.md)

## Quản lý POI Admin — trạng thái triển khai

Phần quản lý POI được triển khai trong `apps/admin` và `services/backend`.

- Danh sách POI sử dụng API thật, có tìm kiếm, lọc trạng thái, phân trang và chọn kích thước trang 10/20/50/100.
- Form tạo/sửa POI có kiểm tra dữ liệu, bao gồm tọa độ, danh mục và bán kính kích hoạt.
- Xuất bản yêu cầu có bản dịch tiếng Anh (`en`) và audio tiếng Anh hiện hành sẵn sàng; nếu thiếu điều kiện, API từ chối xuất bản.
- Xóa POI là xóa mềm thông qua `deleted_at`; không xóa cứng bản ghi hoặc tự động xóa dữ liệu bản dịch/media liên quan.
- Mỗi POI hỗ trợ tối đa 6 ảnh. Có thể tải lên, xóa và sắp xếp ảnh; ảnh đầu tiên là ảnh đại diện.
- Migration `V3__align_poi_admin_uc10.sql` bổ sung `category`, `trigger_radius`, `deleted_at` và bảng `poi_image`. Migration cần được chạy qua quy trình Flyway của backend; không tự sửa database thủ công.

### Kiểm tra gần nhất

| Kiểm tra | Kết quả |
|---|---|
| Admin: `npm test` | 17 tests passed |
| Admin: `npm run lint` | Passed |
| Admin: `npm run build` | Passed |
| Backend: `./mvnw clean test` (JDK 21+) | 10 tests passed |
| Backend integration tests / PostgreSQL migration | **Chưa xác minh trong lượt cập nhật này**; cần PostgreSQL khả dụng và chạy `./mvnw verify` theo mục [Chạy test](#chạy-test) |

> Lưu ý: các kết quả trên là lần kiểm tra gần nhất của nhánh làm việc, không phải cam kết rằng integration tests hoặc migration đã chạy thành công trên database thực.

## Giới hạn MVP

- Khách xem/nghe **không cần đăng nhập** — đây là *giả định cần đối chiếu đặc tả* (Penpot có UC01–UC03 đăng ký/đăng nhập cho khách).
- Nội dung từng ngôn ngữ nhập tay; Google TTS không dịch.
- Không có bản đồ offline; offline chỉ gồm nội dung + audio đã tải.
- Không có thuyết minh tự động theo vị trí, không thu thập vị trí nền.
- Vai trò tĩnh `ADMIN`/`SUPER_ADMIN` (không có RBAC động).
- Lưu trữ file local (volume). Production cần object storage hoặc đĩa bền vững.
- Trạng thái TTS dùng polling (không SSE).

Backlog đầy đủ: [`docs/planning/backlog.md`](docs/planning/backlog.md). Kiến trúc và ERD: [`docs/architecture/architecture.md`](docs/architecture/architecture.md). API: [`docs/architecture/api.md`](docs/architecture/api.md). Triển khai: [`docs/operations/deployment.md`](docs/operations/deployment.md). CI/CD: [`docs/operations/ci-cd.md`](docs/operations/ci-cd.md).

# Giới thiệu
Ứng dụng web/mobile giúp **khách du lịch** khám phá địa điểm và **nghe thuyết minh tự động** theo vị trí GPS, hỗ trợ **đa ngôn ngữ**, hoạt động cả **online và offline**. Hệ thống có trang **admin** để quản lý địa điểm và nội dung thuyết minh.

# Thành viên nhóm 
3124560031 - Trần Viết Hiếu
- 
- 

### 🎯 Mục tiêu
- Tự động phát thuyết minh khi khách đến gần địa điểm (geofencing)
- Hỗ trợ nhiều ngôn ngữ qua Google Cloud TTS
- Hoạt động offline với audio cache sẵn
- CI/CD tự động hóa build & deploy

---