# Tài liệu dự án

Tài liệu được chia theo mục đích để dễ tìm, dễ bảo trì. Phạm vi MVP chỉ bật locale vi/en nhưng kiến trúc mở rộng được; UC08 và UC12 ngoài MVP; soft delete áp dụng toàn hệ thống. Các quyết định và mục mở được ghi tại BRD và Use Case.

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

- [Đặc tả 15 Use Case](requirements/Use_Case_Specification_Final_15_UC.md)
- [BRD](requirements/BRD.md)
- [Quy chuẩn phát triển](development/DEVELOPMENT_STANDARDS.md)
- [Kiến trúc hệ thống](architecture/architecture.md)
- [Hợp đồng API](architecture/api.md)
- [Bản đồ cấu trúc thư mục](architecture/PROJECT_STRUCTURE.md)
- [Backlog](planning/backlog.md)
- [Báo cáo kiểm chứng](reports/verification-report.md)

## Lưu ý về trạng thái triển khai

Đặc tả nghiệp vụ v2.0 chuyển User sang website online-only có Seller/QR. Cấu trúc repository và một số tài liệu kiến trúc vẫn mô tả ứng dụng Mobile React Native cùng các thành phần offline hiện có; chúng phản ánh mã nguồn hiện tại, không phải kiến trúc đích đã chuyển đổi. Việc chuyển kiến trúc/xóa mã nguồn cũ cần được lập kế hoạch và thực hiện riêng.

## Quy tắc cập nhật

- Cập nhật tài liệu liên quan trong cùng thay đổi khi hợp đồng, quyết định hoặc cách chạy hệ thống thay đổi.
- Giữ liên kết tương đối trong Markdown trỏ đúng vị trí mới sau khi di chuyển file.
- Không coi tài liệu hoặc thư mục placeholder là bằng chứng rằng tính năng đã được triển khai.
## Quyết định demo đã chốt (2026-10-20)

- Gói duy nhất `DEMO_24H`: 1 VND, 24 giờ kể từ redeem QR thành công.
- VNPAY Sandbox chỉ dùng thử nghiệm; không dùng production credentials hoặc giao dịch tiền thật.
- QR dùng một lần; grant gắn với phiên trình duyệt/credential. Hủy trước redeem; chưa hoàn tiền sau kích hoạt.
- Chỉ `vi`/`en`; publish POI cần English content và audio hiện hành; gallery tối đa 6 ảnh.
- Analytics MVP, Audit Log và NFR mục tiêu được ghi trong BRD. NFR chưa được đo kiểm.

Các nội dung Seller/payment/QR/Analytics/Audit là yêu cầu/kiến trúc đích cho đến khi đối chiếu code, migration/schema, OpenAPI và test. Cập nhật tài liệu không có nghĩa tính năng đã triển khai.
