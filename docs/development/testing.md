# Kiểm thử

> Các test offline hiện có trong bảng bên dưới là kiểm thử legacy của code hiện tại; chúng không phải tiêu chí nghiệm thu cho ứng dụng User online-only và không có nghĩa tính năng offline nằm trong phạm vi mục tiêu.

| Yêu cầu | Test | Thành phần |
|---|---|---|
| Khách không gọi được API admin | `SecurityIT.guestCannotCallAdminApi` | kiểm thử tích hợp backend |
| Logout thật, token hết hạn bị từ chối, mật khẩu băm BCrypt | `SecurityIT.loginMeLogoutRevokesToken`, `expiredSessionIsRejected`, `passwordIsStoredAsBcryptHash` | kiểm thử tích hợp backend |
| Khách không xem được POI nháp (danh sách, URL chi tiết, manifest, audio) | `PoiFlowIT.draftPoiIsInvisibleToGuestsInListAndByDirectUrl` | kiểm thử tích hợp backend |
| Chọn tiếng Anh nhận đúng nội dung/audio tiếng Anh (so sánh SHA-256 và bytes) | `PoiFlowIT.englishSelectionReturnsEnglishContentAndEnglishAudio` | kiểm thử tích hợp backend |
| Nội dung cập nhật không dùng nhầm audio cũ | `PoiFlowIT.updatingNarrationInvalidatesOldAudio`, `TtsIT.contentChangedDuringGenerationDiscardsResult`, `PoiTranslationTest` | backend |
| TTS lỗi không làm POI biến mất | `TtsIT.failedTtsKeepsPoiAndReportsFailure`, `retryableErrorsAreRetriedThenFail` | kiểm thử tích hợp backend |
| Không có Google credentials vẫn chạy luồng demo | `TtsNotConfiguredIT` | kiểm thử tích hợp backend |
| Tránh tạo lại TTS khi nội dung không đổi | `TtsIT.successfulJobAttachesAudioAndIdenticalRequestIsDeduplicated`, `ContentHashTest` | backend |
| Job bị gián đoạn được phục hồi | `TtsIT.interruptedRunningJobIsRequeuedOnRestart` | kiểm thử tích hợp backend |
| Validation, upload sai định dạng, phân trang, 404/409 | `PoiFlowIT.validationAndUploadRules`, `cannotPublishWithoutContentAndDuplicateCodeConflicts`, `adminListIsPaginated` | kiểm thử tích hợp backend |
| Lưu trữ an toàn (path traversal), nhận dạng định dạng | `LocalMediaStorageTest`, `DetectedMediaTest` | kiểm thử đơn vị backend |
| Dữ liệu offline đã tải vẫn mở được khi mất mạng | `offlineManager.test.ts` ("serves it offline") | mobile |
| Kiểm tra toàn vẹn, retry, file hỏng/mất, cập nhật, xoá | `offlineManager.test.ts` | mobile |
| Thiếu giọng offline được xử lý rõ ràng; không dùng giọng sai ngôn ngữ | `voiceSelection.test.ts` | mobile |
| Ưu tiên nguồn phát, không dùng audio phiên bản cũ | `sourceResolver.test.ts` | mobile |
| Đổi nguồn/ngôn ngữ không phát chồng | `narrationController.test.ts` | mobile |
| Lỗi API thống nhất, 401 đưa về đăng nhập, lỗi mạng | `client.test.js` (admin), `apiClient.test.ts` (mobile) | admin, mobile |
| Đăng nhập admin, trạng thái audio/TTS trên giao diện | `LoginPage.test.jsx`, `AudioPanel.test.jsx`, `PoiEditPage.test.js` | admin |

Lệnh chạy: xem README mục "Chạy test". Kiểm thử tích hợp backend cần PostgreSQL (`TEST_DB_URL`); bảng dữ liệu bị `TRUNCATE` trước mỗi test, nên **không trỏ vào DB thật**.

## Kịch bản kiểm thử mục tiêu — RBAC, Seller, thanh toán và QR (các phần UC12 ngoài MVP)

> Đây là kế hoạch kiểm thử; không có nghĩa các kịch bản đã có kiểm thử tự động hoặc đã chạy thành công.

| Nhóm | Kịch bản | Kết quả mong đợi |
|---|---|---|
| Gói/thời gian | Chỉ có `DEMO_24H` giá 1 VND/24h; thời gian bắt đầu lúc redeem | API từ chối gói ngoài cấu hình; `expires_at = activated_at + 24h` |
| Callback thanh toán | Chữ ký/số tiền/mã tham chiếu sai hoặc trạng thái thất bại | Không xác nhận thanh toán, không cấp quyền |
| Idempotency | Cùng callback gửi lặp | Không tạo giao dịch/QR/grant trùng |
| Tranh chấp khi kích hoạt QR | Hai yêu cầu redeem cùng QR đồng thời | Tối đa một yêu cầu thành công |
| QR không hợp lệ | QR hết hạn, thu hồi, đã dùng hoặc token không hợp lệ | Từ chối cấp quyền |
| Cancel | Hủy trước và sau redeem | Chỉ hủy trước redeem |
| Grant | User gọi API khi chưa redeem hoặc grant hết hạn | Backend từ chối; không dựa riêng vào UI |
| Ownership | Seller A dùng transaction ID của Seller B | Backend từ chối, không lộ dữ liệu |
| Return/IPN | URL quay về báo thành công nhưng IPN chưa xác nhận | Không đánh dấu đã thanh toán chỉ dựa trên chuyển hướng trình duyệt |
| Callback sandbox | IPN hợp lệ tới callback URL khả dụng | Xác minh chữ ký/trạng thái/số tiền và xử lý idempotent |
| Analytics | Lọc theo ngày/POI/ngôn ngữ | Công thức, múi giờ, loại trùng lặp và thời điểm cập nhật đúng đặc tả |
| Audit | Thanh toán, QR/grant, publish, thay đổi role | Có audit event, không lộ secret/token QR |
| Lỗi hệ thống kiểm toán | Kho log không khả dụng | Hành vi fail-open/fail-closed được quyết định và có cảnh báo |
| Yêu cầu phi chức năng (NFR) | Đo API/redeem/tải trang | Báo kết quả kèm thông tin máy, bộ dữ liệu, mức đồng thời và số mẫu |
| Browser | Từ chối vị trí, tab nền, autoplay bị chặn | Auto narration không phát sai; có thông báo/thao tác thủ công |

### Điều kiện kiểm thử Sandbox

- Cần merchant credentials sandbox và cấu hình tách biệt production.
- Callback/IPN cần URL backend mà nhà cung cấp có thể truy cập; không giả định localhost nhận callback Internet.
- Không ghi credentials/token vào log, báo cáo hoặc commit.
- Không có credentials/callback URL thì chạy test với bộ chuyển đổi giả lập và đánh dấu kiểm thử tích hợp VNPAY là **chưa thực hiện**.

## Kiểm thử soft delete toàn hệ thống

- Xóa mềm POI/tài khoản/Seller/thực thể nghiệp vụ không xóa vật lý bản ghi hoặc lịch sử liên quan.
- Bản ghi đã xóa bị ẩn khỏi truy vấn mặc định và không thể tạo nghiệp vụ mới; truy cập trực tiếp vẫn bị backend kiểm tra.
- Restore chỉ dành cho role được cấp quyền và phát sinh audit event.
- Unique constraint không cho tạo bản ghi active trùng với bản ghi active khác; hành vi tái sử dụng định danh đã xóa phải được kiểm thử.
- Audit log không thể sửa/xóa qua API nghiệp vụ; không ghi secret/token QR/mật khẩu dạng rõ.
- Kiểm thử migration/index/foreign key để soft delete không làm hỏng báo cáo, lịch sử hoặc tham chiếu dữ liệu.
