# Mobile API

Chứa lớp client gọi API backend: endpoint, request/response mapping và tích hợp HTTP dùng bởi màn hình/feature.

Không đặt giao diện hoặc logic nghiệp vụ lõi tại đây. Tập trung xử lý HTTP ở một cách nhất quán; không lưu token/secret vào source code. Thay đổi hợp đồng phải đồng bộ `docs/architecture/api.md` và test liên quan.
