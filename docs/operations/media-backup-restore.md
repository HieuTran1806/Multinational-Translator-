# Sao lưu và phục hồi Media

## Kiến trúc hiện tại

- Backend lưu file qua `APP_STORAGE_LOCAL_ROOT` (mặc định `./data/media`; trong container Render thường là `/app/data/media`).
- Database chỉ lưu `storage_key`, không lưu file nhị phân.
- Backend production dùng Cloudflare R2 (`APP_STORAGE_PROVIDER=r2`); không lưu media production vào filesystem container.

## Điều kiện trước khi dùng production

Cấu hình persistent disk trên Render hoặc chuyển `MediaStorage` sang object storage (S3/GCS/R2) trước khi xem media là bền vững. Tài liệu này chưa xác minh cấu hình persistent storage thực tế trên dịch vụ đang chạy; không được giả định rằng file sẽ tồn tại sau redeploy.

## Backup và restore

- Sao lưu database Neon bằng chức năng backup/branch phù hợp với gói và chính sách hiện tại; lưu trữ bản backup ngoài database gốc.
- Sao lưu media từ persistent disk/object storage bằng công cụ tương ứng của nhà cung cấp.
- Đồng bộ thời điểm backup database và media để `storage_key` vẫn trỏ tới file tồn tại.
- Khi restore, khôi phục database và media về cùng mốc; kiểm tra thủ công các key tham chiếu trước khi mở lại lưu lượng.
- Thực hiện thử nghiệm restore trên môi trường không production trước khi dựa vào backup trong sự cố.

Không dùng lệnh backup/restore PostgreSQL local hoặc Docker Compose cho quy trình production. Không đưa credentials vào script hoặc log; không tự động xóa file/bản ghi được phát hiện là không nhất quán.
