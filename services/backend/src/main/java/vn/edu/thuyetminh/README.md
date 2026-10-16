# Backend application package

Package gốc của backend. `ThuyetMinhApplication.java` là entry point; các package con chia theo domain: auth, language, poi, audio, tts, media và common.

Giữ controller/API boundary, service nghiệp vụ và persistence concerns tách bạch theo cấu trúc đang dùng. Không tạo logic nghiệp vụ lặp ở controller và không bỏ qua kiểm tra quyền server-side.