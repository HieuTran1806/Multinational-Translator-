# Mobile Storage

Chứa adapter/lớp truy cập lưu trữ cục bộ và serialization của dữ liệu cần lưu bền vững.

Tách storage khỏi UI và business logic; xử lý lỗi đọc/ghi, migration dữ liệu cục bộ khi cần và tránh lưu secret không an toàn. Phối hợp với offline module để xác định dữ liệu nào được lưu và vòng đời dữ liệu.
