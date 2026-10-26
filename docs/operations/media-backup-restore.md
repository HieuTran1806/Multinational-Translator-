# Sao lưu và phục hồi Media

## Kiến trúc lưu trữ

- **Thư mục media root:** cấu hình qua `APP_STORAGE_LOCAL_ROOT` (mặc định `./data/media` local, `/app/data/media` trong Docker).
- **Cấu trúc:** `images/<uuid>.<ext>` và `audio/<uuid>.<ext>`.
- **Database** chỉ lưu `storage_key` (đường dẫn tương đối), không lưu file nhị phân.
- **Docker Compose:** named volume `media:/app/data/media`.
- **Dockerfile:** khai báo `VOLUME ["/app/data/media"]`.

## Trạng thái Botkeep persistence

**CHƯA XÁC MINH.** Không có bằng chứng từ tài liệu chính thức của Botkeep rằng filesystem container tồn tại qua redeploy/rebuild. Named volume trong Docker Compose chỉ bền vững trên máy local; trên nền tảng PaaS, cần xác nhận platform có hỗ trợ persistent volume mount hay không trước khi tin tưởng dữ liệu sẽ giữ được.

## Quy trình Backup

### 1. Sao lưu file media

```bash
# Docker Compose local: copy từ named volume
docker run --rm -v multitional-translator_media:/data -v $(pwd)/backup:/backup alpine \
  tar czf /backup/media-$(date +%Y%m%d).tar.gz -C /data .

# VPS trực tiếp:
tar czf /backup/media-$(date +%Y%m%d).tar.gz -C /srv/thuyetminh/media .
```

### 2. Sao lưu database

```bash
docker exec multitional-translator-postgres-1 pg_dump -U thuyetminh thuyetminh \
  > /backup/db-$(date +%Y%m%d).sql
```

### 3. Đồng bộ thời điểm

Luôn backup media và DB gần cùng thời điểm. `storage_key` trong DB phải trỏ đến file thực sự tồn tại trong bản backup media.

## Quy trình Restore

### Thứ tự bắt buộc

1. **Restore database trước** để có metadata (`storage_key`).
2. **Restore media sau** vào đúng thư mục/volume.
3. **Kiểm tra nhất quán** giữa DB và filesystem.

### Lệnh restore

```bash
# Database
cat /backup/db-20260101.sql | docker exec -i multitional-translator-postgres-1 psql -U thuyetminh -d thuyetminh

# Media (Docker volume)
docker run --rm -v multitional-translator_media:/data -v $(pwd)/backup:/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/media-20260101.tar.gz -C /data"
```

## Kiểm tra nhất quán sau restore

Chạy truy vấn tìm bản ghi mồ côi (metadata trỏ đến file không tồn tại):

```sql
-- Audio assets không có file tương ứng
SELECT a.storage_key FROM audio_asset a
WHERE NOT EXISTS (
    SELECT 1 FROM pg_ls_dir('/app/data/media') f WHERE f = a.storage_key
);
```

Hoặc dùng script kiểm tra ngoài:

```bash
# Liệt kê storage_key trong DB, kiểm tra từng file
psql -t -c "SELECT storage_key FROM audio_asset UNION SELECT storage_key FROM poi_image" | \
while read key; do
  [ ! -f "/srv/thuyetminh/media/$key" ] && echo "MISSING: $key"
done
```

**Không tự động xóa** file hoặc bản ghi phát hiện bất nhất. Đánh dấu và xử lý thủ công.

## Lưu ý

- File placeholder demo (`images/demo-placeholder.png`) có thể tái tạo tự động khi chạy profile `dev`, không cần backup.
- Không đưa credentials database vào script backup. Dùng `.pgpass` hoặc biến môi trường.
- shortcut: hướng dẫn này chưa được kiểm chứng bằng restore thực tế trên production, chỉ mới viết dựa trên cấu hình hiện có. Cần test restore trên môi trường staging trước khi áp dụng thật.
