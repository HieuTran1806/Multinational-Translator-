/**
 * Seed data for the mock API. Shapes follow the backend entities (not the DTOs);
 * handlers.js turns them into the exact response shapes from docs/architecture/api.md.
 * Edit freely to get the UI states you need (empty content, failed TTS, many pages...).
 */

export const LANGUAGES = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const TTS_STATUS = { configured: true, provider: 'mock', maxInputBytes: 5000 };

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

function tr(languageCode, name, description, narrationText, contentVersion = 1) {
  return { languageCode, name, description, narrationText, contentVersion, updatedAt: daysAgo(2) };
}

const HAND_WRITTEN = [
  {
    code: 'BEN-DUOC',
    defaultName: 'Khu di tích Bến Dược',
    latitude: 11.14302,
    longitude: 106.46183,
    category: 'Di tích lịch sử',
    triggerRadius: 80,
    status: 'PUBLISHED',
    demo: true,
    images: 2,
    translations: [
      tr('vi', 'Khu di tích Bến Dược', 'Căn cứ Khu ủy Sài Gòn – Gia Định.',
        'Bến Dược là nơi đặt căn cứ của Khu ủy Sài Gòn – Gia Định trong kháng chiến chống Mỹ. Hệ thống địa đạo tại đây có nhiều tầng, nhiều ngách.'),
      tr('en', 'Ben Duoc Relic Site', 'Former base of the Saigon – Gia Dinh Party Committee.',
        'Ben Duoc was the base of the Saigon – Gia Dinh Party Committee during the war. The tunnels here have several levels and many branches.'),
    ],
    audio: { vi: 'UPLOAD', en: 'TTS' },
  },
  {
    code: 'BEN-DINH',
    defaultName: 'Khu di tích Bến Đình',
    latitude: 11.06123,
    longitude: 106.53075,
    category: 'Di tích lịch sử',
    triggerRadius: 60,
    status: 'PUBLISHED',
    demo: true,
    images: 1,
    translations: [
      tr('vi', 'Khu di tích Bến Đình', 'Đoạn địa đạo mở cửa cho khách tham quan.',
        'Bến Đình có đoạn địa đạo được nới rộng để khách tham quan có thể trải nghiệm. Hãy cúi thấp người khi đi vào.'),
      tr('en', 'Ben Dinh Relic Site', 'Tunnel section open to visitors.',
        'Ben Dinh has a widened tunnel section so visitors can experience it. Please keep your head low when entering.'),
    ],
    audio: { en: 'UPLOAD' },
  },
  {
    code: 'HAM-CHONG',
    defaultName: 'Hầm chông',
    latitude: 11.14251,
    longitude: 106.46302,
    category: 'Bẫy chiến tranh',
    triggerRadius: 30,
    status: 'DRAFT',
    demo: false,
    images: 0,
    translations: [
      tr('vi', 'Hầm chông', 'Các loại bẫy chông tre.', 'Hầm chông là loại bẫy được ngụy trang bằng lá cây, bên dưới cắm chông tre vót nhọn.', 3),
      // English content saved, but no audio yet → publishing returns PUBLISH_NOT_READY
      tr('en', 'Spike Traps', 'Bamboo spike traps.', 'Spike traps were covered with leaves, with sharpened bamboo stakes hidden underneath.'),
    ],
    audio: {},
  },
  {
    code: 'BEP-HOANG-CAM',
    defaultName: 'Bếp Hoàng Cầm',
    latitude: 11.14355,
    longitude: 106.46121,
    category: 'Sinh hoạt',
    triggerRadius: 40,
    status: 'DRAFT',
    demo: false,
    images: 1,
    translations: [
      // Text contains "#fail" → the mock TTS job ends FAILED, handy for the error UI
      tr('vi', 'Bếp Hoàng Cầm', 'Bếp nấu không khói.', 'Bếp Hoàng Cầm giúp nấu ăn mà khói tỏa ra sát mặt đất, khó bị phát hiện. #fail'),
    ],
    audio: {},
  },
  {
    code: 'GIENG-NUOC',
    defaultName: 'Giếng nước trong địa đạo',
    latitude: 11.14199,
    longitude: 106.46077,
    category: null,
    triggerRadius: 50,
    status: 'DRAFT',
    demo: false,
    images: 0,
    translations: [],
    audio: {},
  },
];

/** Extra generic POIs so pagination and search have something to work with. */
const GENERATED = Array.from({ length: 18 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    code: `DIEM-${n}`,
    defaultName: `Điểm tham quan số ${n}`,
    latitude: 11.14 + i * 0.0007,
    longitude: 106.46 + i * 0.0005,
    category: i % 2 ? 'Cảnh quan' : 'Di tích lịch sử',
    triggerRadius: 50,
    status: i % 3 === 0 ? 'PUBLISHED' : 'DRAFT',
    demo: false,
    images: i % 4 === 0 ? 1 : 0,
    translations: i % 3 === 0
      ? [tr('vi', `Điểm tham quan số ${n}`, '', 'Nội dung thuyết minh mẫu.'), tr('en', `Stop ${n}`, '', 'Sample narration.')]
      : [tr('vi', `Điểm tham quan số ${n}`, '', 'Nội dung thuyết minh mẫu.')],
    audio: i % 3 === 0 ? { en: 'UPLOAD' } : {},
  };
});

export const SEED_POIS = [...HAND_WRITTEN, ...GENERATED];
export { daysAgo };
