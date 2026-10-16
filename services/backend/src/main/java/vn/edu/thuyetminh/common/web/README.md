# Backend Web Layer

Chứa concerns dùng chung cho HTTP/web boundary như filters, interceptors, advice hoặc cấu hình web nếu hiện tại cần.

Không để lớp này chứa business logic của POI/audio/user. Đảm bảo request validation, response format, auth context và logging hoạt động nhất quán.