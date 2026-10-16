# Backend Common

Chứa cross-cutting concerns dùng chung giữa domain: config, error handling, web concerns và helper hạ tầng.

Chỉ đặt code thật sự dùng chung tại đây; tránh biến common thành nơi chứa business logic không có chủ sở hữu. Thống nhất format lỗi, validation response và log an toàn.