# Backend Error Handling

Chứa exception/domain error mapping và định dạng response lỗi thống nhất.

Phân biệt validation, authentication, authorization, not found, conflict, lỗi provider và internal errors. Không trả stack trace hoặc dữ liệu nhạy cảm cho client; log cần có ngữ cảnh nhưng phải được làm sạch.