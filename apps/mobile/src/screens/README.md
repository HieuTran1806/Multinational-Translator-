# Mobile Screens

Chứa màn hình cấp route cho Tourist Mobile, ánh xạ các luồng UC01–UC09: xác thực, chọn ngôn ngữ, khám phá bản đồ, chi tiết POI, image viewer, audio player, auto narration và offline management.

Screen chịu trách nhiệm ghép component và điều phối UI; tái sử dụng logic từ api/audio/offline/state. Không tạo màn hình độc lập chỉ vì có một state board trên Penpot; loading/error/confirmation có thể là trạng thái hoặc component.
