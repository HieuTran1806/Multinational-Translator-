# Mobile Audio

Chứa logic phía client liên quan phát audio/thuyết minh: điều khiển playback, trạng thái phát/dừng/tạm dừng, tiến trình và xử lý lỗi.

Phạm vi liên quan UC07–UC08. UI player nằm ở screen/component; module này không được tự giả định audio đã sẵn sàng nếu API chưa xác nhận. Tách rõ audio streaming/remote với nội dung đã tải offline.
