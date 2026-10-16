# Kiểm thử

| Yêu cầu | Test | Thành phần |
|---|---|---|
| Khách không gọi được API admin | `SecurityIT.guestCannotCallAdminApi` | backend IT |
| Logout thật, token hết hạn bị từ chối, mật khẩu băm BCrypt | `SecurityIT.loginMeLogoutRevokesToken`, `expiredSessionIsRejected`, `passwordIsStoredAsBcryptHash` | backend IT |
| Khách không xem được POI nháp (danh sách, URL chi tiết, manifest, audio) | `PoiFlowIT.draftPoiIsInvisibleToGuestsInListAndByDirectUrl` | backend IT |
| Chọn tiếng Anh nhận đúng nội dung/audio tiếng Anh (so sánh SHA-256 và bytes) | `PoiFlowIT.englishSelectionReturnsEnglishContentAndEnglishAudio` | backend IT |
| Nội dung cập nhật không dùng nhầm audio cũ | `PoiFlowIT.updatingNarrationInvalidatesOldAudio`, `TtsIT.contentChangedDuringGenerationDiscardsResult`, `PoiTranslationTest` | backend |
| TTS lỗi không làm POI biến mất | `TtsIT.failedTtsKeepsPoiAndReportsFailure`, `retryableErrorsAreRetriedThenFail` | backend IT |
| Không có Google credentials vẫn chạy luồng demo | `TtsNotConfiguredIT` | backend IT |
| Tránh tạo lại TTS khi nội dung không đổi | `TtsIT.successfulJobAttachesAudioAndIdenticalRequestIsDeduplicated`, `ContentHashTest` | backend |
| Job bị gián đoạn được phục hồi | `TtsIT.interruptedRunningJobIsRequeuedOnRestart` | backend IT |
| Validation, upload sai định dạng, phân trang, 404/409 | `PoiFlowIT.validationAndUploadRules`, `cannotPublishWithoutContentAndDuplicateCodeConflicts`, `adminListIsPaginated` | backend IT |
| Lưu trữ an toàn (path traversal), nhận dạng định dạng | `LocalMediaStorageTest`, `DetectedMediaTest` | backend unit |
| Dữ liệu offline đã tải vẫn mở được khi mất mạng | `offlineManager.test.ts` ("serves it offline") | mobile |
| Kiểm tra toàn vẹn, retry, file hỏng/mất, cập nhật, xoá | `offlineManager.test.ts` | mobile |
| Thiếu giọng offline được xử lý rõ ràng; không dùng giọng sai ngôn ngữ | `voiceSelection.test.ts` | mobile |
| Ưu tiên nguồn phát, không dùng audio phiên bản cũ | `sourceResolver.test.ts` | mobile |
| Đổi nguồn/ngôn ngữ không phát chồng | `narrationController.test.ts` | mobile |
| Lỗi API thống nhất, 401 đưa về đăng nhập, lỗi mạng | `client.test.js` (admin), `apiClient.test.ts` (mobile) | admin, mobile |
| Đăng nhập admin, trạng thái audio/TTS trên giao diện | `LoginPage.test.jsx`, `AudioPanel.test.jsx`, `PoiEditPage.test.js` | admin |

Lệnh chạy: xem README mục "Chạy test". Integration test backend cần PostgreSQL (`TEST_DB_URL`); bảng dữ liệu bị `TRUNCATE` trước mỗi test, nên **không trỏ vào DB thật**.
