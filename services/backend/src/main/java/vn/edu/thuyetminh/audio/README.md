# Backend Audio

Chứa nghiệp vụ audio, trạng thái tác vụ, liên kết audio với POI/ngôn ngữ và các thao tác mà backend chịu trách nhiệm.

Phối hợp với `tts/` cho quá trình tạo audio và API status. Trạng thái processing/completed/failed phải có ý nghĩa nhất quán; không trả completed khi file chưa sẵn sàng.