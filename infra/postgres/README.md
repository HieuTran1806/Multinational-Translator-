# PostgreSQL infrastructure

Chứa cấu hình PostgreSQL bổ sung phục vụ local/CI/deployment theo cách triển khai của dự án.

Schema thay đổi nên đi qua migration do backend quản lý; tránh tạo một nguồn schema thứ hai không đồng bộ. Không lưu credential hoặc dữ liệu production trong thư mục này.