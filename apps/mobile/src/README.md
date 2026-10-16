# apps/mobile/src/

Mã nguồn runtime của Tourist Mobile. Thư mục con được chia theo trách nhiệm kỹ thuật: API, audio, components, config, i18n, navigation, network, offline, screens, state, storage, types và utils.

Quy tắc:
- Màn hình điều phối UI; logic nghiệp vụ/tích hợp được đặt ở module phù hợp.
- Dùng token từ `theme.ts`, tránh hard-code màu/spacing.
- Tách UI state, server state và lưu trữ cục bộ.
- Giữ xử lý offline rõ ràng về dữ liệu tải, trạng thái và lỗi.
- Mọi luồng phải tuân thủ Use Case và có trạng thái loading/empty/error phù hợp.
