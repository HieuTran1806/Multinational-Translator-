# Bản đồ cấu trúc thư mục

Tài liệu này mô tả cấu trúc repository hiện có. Lưu ý: cấu trúc bên dưới vẫn phản ánh ứng dụng Mobile React Native/Admin Web trước thay đổi nghiệp vụ; chưa phải kiến trúc đích cho website User online-only và Seller/QR theo `docs/requirements/Use_Case_Specification_Final_15_UC.md`. Cần có thay đổi kiến trúc/triển khai riêng; cập nhật đặc tả không tự động chuyển đổi mã nguồn.

## 1. Cây thư mục chính

```text
Multitional-Translator-/
├── apps/
│   ├── mobile/                         # Tourist Mobile (React Native)
│   │   └── src/
│   │       ├── api/                    # API client/endpoint
│   │       ├── audio/                  # phát và điều phối audio
│   │       ├── components/             # UI components dùng chung
│   │       ├── config/                 # cấu hình ứng dụng
│   │       ├── i18n/                   # locale và bản dịch UI
│   │       ├── navigation/             # route và điều hướng
│   │       ├── network/                # trạng thái/kết nối mạng
│   │       ├── offline/                # dữ liệu và tác vụ offline
│   │       ├── screens/                # màn hình Tourist
│   │       │   ├── auth/               # UC01–UC03
│   │       │   ├── language/           # UC04
│   │       │   ├── map/                # UC05
│   │       │   ├── poi/                # UC06
│   │       │   ├── audio/              # UC07
│   │       │   ├── narration/          # UC08
│   │       │   ├── offline/            # UC09
│   │       │   └── profile-settings/   # chỉ khi UX được xác nhận
│   │       ├── state/                  # state dùng chung
│   │       ├── storage/                # lưu trữ cục bộ
│   │       ├── types/                  # kiểu dữ liệu
│   │       └── utils/                  # tiện ích dùng chung
│   └── admin/                          # Admin/Super Admin Web
│       └── src/
│           ├── api/                    # API client
│           ├── auth/                   # session/access behavior phía client
│           ├── components/             # UI components dùng chung
│           ├── features/
│           │   ├── poi-management/     # UC10
│           │   ├── audio-monitoring/   # UC11
│           │   ├── user-management/    # UC12
│           │   ├── admin-management/   # UC13
│           │   ├── roles-permissions/  # UC14
│           │   ├── analytics/          # UC15
│           │   └── audit-logs/         # UC16
│           ├── pages/                  # màn hình cấp route
│           └── test/                   # test frontend
├── services/
│   └── backend/
│       └── src/main/java/vn/edu/thuyetminh/
│           ├── auth/                   # xác thực UC01–UC03
│           ├── language/               # ngôn ngữ UC04
│           ├── poi/                    # POI
│           ├── audio/                  # nghiệp vụ audio
│           ├── tts/                    # text-to-speech
│           ├── media/                  # media/file
│           ├── common/                 # config/error/web
│           ├── user/                   # đích cho UC12
│           ├── admin/                  # đích cho UC13
│           ├── rbac/                   # đích cho UC14
│           ├── analytics/              # đích cho UC15
│           └── audit/                  # đích cho UC16
├── infra/
│   ├── fixtures/                       # dữ liệu phục vụ dev/test
│   ├── postgres/                       # cấu hình PostgreSQL
│   └── scripts/                        # script hạ tầng
├── .github/workflows/                  # CI/CD
└── docs/                               # đặc tả và hướng dẫn
```

## 2. Phân chia trách nhiệm

- **Mobile**: Tourist UC01–UC09; không chứa điều hướng Admin.
- **Admin Web**: giao diện UC10–UC16; UI không thay thế kiểm tra quyền tại backend.
- **Backend**: API, logic nghiệp vụ, validation server-side, persistence, auth/RBAC và audit.
- **Infra**: cấu hình môi trường và script vận hành; không đặt business logic tại đây.
- **Docs**: đặc tả, hợp đồng và quyết định đã thống nhất.

## 3. Đối chiếu Penpot

Trang `02 — Design System` có các nhóm token màu, typography, spacing, iconography, buttons, inputs, cards, navigation, POI marker, audio control, feedback và state coverage. Vì vậy:
- UI dùng token/component chung; không tạo palette riêng trong từng feature.
- Button/Input/Card/Feedback nên tái sử dụng từ component dùng chung.
- POI/audio/permission UI chỉ chứa behavior thuộc đúng Use Case; các thư mục offline hiện hữu là dấu vết triển khai cũ và không thuộc phạm vi nghiệp vụ đích.
- Các state board không mặc nhiên là route/màn hình độc lập.

Penpot hiện được dùng làm nguồn tham chiếu thiết kế. Việc kiểm tra cấu trúc trang không tự động chứng minh rằng toàn bộ token đã được xuất thành code hoặc mọi UI đã hoàn thiện.

## 4. Trạng thái các thư mục mới

Các thư mục con feature trong `apps/mobile/src/screens/`, `apps/admin/src/features/` và backend domain `user/`, `admin/`, `rbac/`, `analytics/`, `audit/` được chuẩn bị kèm README để làm rõ nơi đặt code tương lai. **Chỉ tạo cấu trúc và tài liệu; không di chuyển hoặc viết lại code hiện có.** Các file screen/feature đang nằm ở vị trí cũ cần được refactor riêng sau khi kiểm tra imports, routes và tests.

## 5. Quy tắc thay đổi

1. Đặt code gần feature sở hữu; tránh nhân bản logic.
2. Trước khi chuyển file, kiểm tra import, route, test và build.
3. Controller không nên chứa business logic; UI không phải cơ chế bảo mật.
4. Không tạo feature/màn hình ngoài 15 Use Case hiện hành nếu chưa được phê duyệt.
5. Khi thêm code vào thư mục mới, cập nhật README tương ứng để mô tả module thực tế.
