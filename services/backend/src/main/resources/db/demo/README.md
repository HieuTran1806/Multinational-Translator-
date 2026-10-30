# Demo database data

Chứa seed/demo data không nhạy cảm để hỗ trợ local hoặc trình diễn. Dữ liệu phải được nhận diện rõ là dữ liệu mẫu, có thể tái tạo và không chứa thông tin cá nhân thật hoặc secret.

Không dùng demo data như dữ liệu production mặc định nếu chưa có quyết định triển khai rõ ràng.

## Tài khoản Admin demo

Các tài khoản dưới đây chỉ được tạo khi backend chạy với profile `dev`, profile này bổ sung `classpath:db/demo` vào Flyway. Không bật seed demo trong production.

| Username | Vai trò | Mật khẩu dùng chung |
| --- | --- | --- |
| `admin01` | `ADMIN` | `123456` |

Đăng nhập qua `POST /api/v1/auth/login` với JSON `{"username":"admin01","password":"123456"}` (thay username để thử tài khoản khác). Đây là mật khẩu yếu, chỉ dùng cho local/demo; không dùng ở môi trường công khai. Đổi hoặc xoá các tài khoản demo trước khi triển khai.

Migration `V101__demo_admin_accounts.sql` lưu BCrypt hash, không lưu mật khẩu dạng rõ. `ON CONFLICT (username) DO NOTHING` giúp chạy lặp mà không ghi đè tài khoản đã tồn tại.

## QR truy cập demo (UC02)

`V102__demo_access_qr.sql` tạo sẵn 3 QR thuộc gói `DEMO_24H` (quyền 24 giờ kể từ lúc đổi). DB chỉ lưu SHA-256 của token.

| Token QR | Ghi chú |
| --- | --- |
| `DEMO-QR-0001` | `[DEMO] DEMO-QR-0001` |
| `DEMO-QR-0002` | `[DEMO] DEMO-QR-0002` |
| `DEMO-QR-0003` | `[DEMO] DEMO-QR-0003` |

Mỗi token chỉ đổi được **một lần** trên database local. Đổi thử:

```powershell
$body = '{"qrToken":"DEMO-QR-0001","deviceId":"demo-device-000000001"}'
Invoke-RestMethod -Method Post http://localhost:8080/api/v1/public/access/redeem -ContentType 'application/json' -Body $body
```

Dùng hết thì đăng nhập Admin và tạo QR mới qua `POST /api/v1/admin/access-qrs`. Token demo dễ đoán, chỉ dùng cho local; QR thật luôn do backend sinh ngẫu nhiên.
