# Static Authorization Policy

Role policy cố định; không có dynamic RBAC, permission editor hoặc CRUD role-permission.

- `ADMIN`: POI, translations, media/audio, QR và Analytics.
- `SUPER_ADMIN`: tài khoản Admin và Audit Log.
- Matcher cụ thể phải đứng trước `/api/v1/admin/**`; Super Admin không kế thừa Admin; default deny.
