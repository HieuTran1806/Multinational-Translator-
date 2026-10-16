# Tài liệu dự án

Tài liệu được chia theo mục đích để dễ tìm, dễ bảo trì. Phạm vi nghiệp vụ phải luôn khớp đặc tả 16 Use Case đã phê duyệt.

## Danh mục

| Thư mục | Nội dung |
|---|---|
| [`requirements/`](requirements/) | Đặc tả Use Case và yêu cầu nghiệp vụ — nguồn chuẩn về phạm vi chức năng. |
| [`architecture/`](architecture/) | Kiến trúc hệ thống, hợp đồng API và bản đồ cấu trúc repository. |
| [`development/`](development/) | Quy chuẩn phát triển, hướng dẫn Mobile và kiểm thử. |
| [`planning/`](planning/) | Backlog, giả định và kế hoạch kỹ thuật cần theo dõi. |
| [`operations/`](operations/) | CI/CD, triển khai và template workflow. |
| [`integrations/`](integrations/) | Hướng dẫn tích hợp Google Maps và Google Cloud TTS. |
| [`reports/`](reports/) | Báo cáo kiểm chứng hiện trạng và giới hạn đã xác minh. |

## Điểm bắt đầu

- [Đặc tả 16 Use Case](requirements/Use_Case_Specification_Final_16_UC.md)
- [Quy chuẩn phát triển](development/DEVELOPMENT_STANDARDS.md)
- [Kiến trúc hệ thống](architecture/architecture.md)
- [Hợp đồng API](architecture/api.md)
- [Bản đồ cấu trúc thư mục](architecture/PROJECT_STRUCTURE.md)
- [Backlog](planning/backlog.md)
- [Báo cáo kiểm chứng](reports/verification-report.md)

## Quy tắc cập nhật

- Cập nhật tài liệu liên quan trong cùng thay đổi khi hợp đồng, quyết định hoặc cách chạy hệ thống thay đổi.
- Giữ liên kết tương đối trong Markdown trỏ đúng vị trí mới sau khi di chuyển file.
- Không coi tài liệu hoặc thư mục placeholder là bằng chứng rằng tính năng đã được triển khai.