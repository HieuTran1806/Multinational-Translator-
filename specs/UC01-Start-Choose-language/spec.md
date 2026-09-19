# Use case number: UC01
# Use case name:
Khởi động & Chọn ngôn ngữ
# Actor (s):
Người dùng
# Maturity:
Không rõ

# Sumary:
Không rõ

# Basic course of events:
- Khi người dùng truy cập vào địa chỉ trang web #A1, hệ thống hiển thị giao diện chào mừng trong 1-1.5 giây rồi chuyển tiếp sang giao diện chọn ngôn ngữ.
- Hệ thống có khả năng nhận diện ngôn ngữ mặc định dựa trên cài đặt của trình duyệt hoặc thiết bị. Do đó mặc định sẽ hiển thị sẵn cho người dùng ngôn ngữ của thiết bị đầu tiên #E2.
- Hệ thống tải danh sách ngôn ngữ #E1 và cho phép người dùng 2 loại ngôn ngữ: `Ngôn ngữ hiển thị (text)` và `Ngôn ngữ thuyết minh (audio)`, sắp xếp theo thứ tự từ trên xuống. Người dùng chọn lần lượt 2 loại ngôn ngữ #A2.
- Sau khi người dùng chọn và bấm `Xác nhận` (nút này luôn ở trạng thái `Acitve` - có thể bấm), hệ thống sẽ chuyển tiếp sang giao diện màn hình chính.

# Alternative paths:
- #A1: Nếu là người dùng cũ từng truy cập, hệ thống sẽ truy cập dữ liệu cũ như `Cookie/Local Storage` chọn lại ngôn ngữ đã chọn ở lần trước và chuyển tiếp sang giao diện màn hình chính.
- #A2: Khi người dùng lần đầu thay đổi `Ngôn ngữ hiển thị (text)` sẽ thay đổi cả `Ngôn ngữ thuyết minh (audio)`. Nếu người dùng chọn `Ngôn ngữ thuyết minh (audio)` trước thì không làm gì cả. Từ lần thay đổi thứ 2 trở đi, 2 lựa chọn ngôn ngữ này sẽ hoàn toàn tách biệt độc lập.
- Người dùng có thể chỉnh sửa ngôn ngữ về sau này bằng một chức năng khác.

# Exception paths:
- #E1: Nếu không tải được danh sách ngôn ngữ, hệ thống sẽ báo lỗi cho khách hàng và chỉ hiển thị 1 tùy chọn là ngôn ngữ mặc định được code. Để tải lại danh sách ngôn ngữ, người dùng cần `Reload` - tải lại trang web. Ngôn ngữ người dùng chọn chỉ được lưu vào `Cookie/Local Storage` sau khi bấm nút `Xác nhận`
- #E2: Nếu ngôn ngữ hiện tại của thiết bị người dùng chưa được hệ thống hỗ trợ thì sẽ mặc định hiển thị ngôn ngữ `English` - tiếng Anh.

# Note:
- Danh sách ngôn ngữ chỉ được cập nhập mới chỉ khi ngôn ngữ đó đã được cung cấp hoàn thiện trên toàn hệ thống.
- Với mỗi ngôn ngữ, tên ngôn ngữ hiển thị trên danh sách ngôn ngữ sử dụng chính ngôn ngữ đó để người dùng dễ nhận diện.
- Việc xin cấp quyền sử dụng `Vị trí` sẽ được hỏi sau khi chuyển tiếp vào màn hình chính.
- Nếu thông tin lưu trong `Cookie/Local Storage` bị hỏng, hệ thống sẽ xóa cache và quay lại luồng chọn ngôn ngữ mới từ đầu.

