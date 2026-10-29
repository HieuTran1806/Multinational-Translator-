# Roles & Permissions — policy tĩnh

Role policy là tĩnh, không có giao diện CRUD role/permission hoặc permission matrix động. `AccountRole` chỉ gồm `ADMIN` và `SUPER_ADMIN`.

- `ADMIN`: POI, bản dịch, media/audio, QR quản trị và Analytics toàn hệ thống.
- `SUPER_ADMIN`: quản lý tài khoản Admin và đọc Audit Log.
- Super Admin không kế thừa quyền Admin; mọi route không được khai báo bị từ chối.
- UI chỉ giải thích ma trận quyền; backend `SecurityConfig` và service-level checks là nguồn thực thi.
