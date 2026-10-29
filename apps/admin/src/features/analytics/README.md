# Analytics — UC14

Dashboard hiển thị số liệu vận hành toàn hệ thống do backend cung cấp. Chỉ role `ADMIN` được truy cập UI và `/api/v1/admin/analytics/**`; `SUPER_ADMIN` bị từ chối ở backend.

Không còn Seller-scoped analytics hoặc Seller reports. UI phải phản ánh loading/empty/error states từ API thật.
