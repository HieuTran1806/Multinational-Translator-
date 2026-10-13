# Mobile — React Native CLI 0.87 + TypeScript

Hướng dẫn đầy đủ: [`../../docs/mobile.md`](../../docs/mobile.md) · Maps: [`../../docs/google-maps.md`](../../docs/google-maps.md)

```bash
cp .env.example .env      # API_BASE_URL, GOOGLE_MAPS_ANDROID_API_KEY (tuỳ chọn)
npm ci                    # cũng áp dụng patches/ (patch-package)
npm start                 # Metro
npm run android           # emulator / thiết bị
npm run lint && npm run typecheck && npm test
```

Cấu trúc `src/`: `api/` (client REST), `audio/` (player, controller, TTS thiết bị, chọn nguồn), `offline/` (tải/kiểm tra/xoá), `storage/` (SQLite), `screens/`, `navigation/`, `components/`, `i18n/`, `config/`.
