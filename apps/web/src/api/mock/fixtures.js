/**
 * Static demo data for the mock API (VITE_USE_MOCK=true). Mirrors the shape of the backend demo
 * seed (services/backend/src/main/resources/db/demo/V100__demo_pois.sql): a small cluster of
 * published POIs around the Củ Chi area with vi/en translations.
 *
 * Scenario switches for manual testing of the exception flows:
 * - POI "DEMO-VUON-CAO-SU" has no audio in any language  → UC05-A2 (transcript only)
 * - POI "DEMO-TRUONG-BAN" has only a vi translation      → UC04-A1 (fallback notice for other langs)
 * - Unknown id (e.g. /pois/9999)                         → UC04-E1 (404 back to map)
 */

export const LANGUAGES = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

// ---------- Inline media (no network needed in mock mode) ----------

/** Short tone/silence WAV as a data URI so the narration player really plays in mock mode. */
function toneWavDataUri() {
  const rate = 8000;
  const seconds = 5;
  const n = rate * seconds;
  const bytes = new Uint8Array(44 + n);
  const v = new DataView(bytes.buffer);
  const str = (off, s) => s.split('').forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true); // 8-bit
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const freq = Math.floor(t) % 2 === 0 ? 440 : 330; // alternate A4 / E4 each second
    const amp = t % 1 < 0.6 ? 0.3 : 0; // 0.6s tone then rest
    bytes[44 + i] = Math.round(128 + (amp ? Math.sin(2 * Math.PI * freq * t) * amp : 0) * 110);
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

function svgImageDataUri(title, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + `<rect width="640" height="400" fill="url(#g)"/>`
    + `<circle cx="545" cy="70" r="38" fill="#fff9ee" opacity="0.85"/>`
    + `<path d="M0 400 L180 250 L320 360 L470 220 L640 400 Z" fill="#293526" opacity="0.35"/>`
    + `<text x="32" y="368" font-family="sans-serif" font-size="26" fill="#fff9ee">${title}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AUDIO_URI = toneWavDataUri();
let audioSeq = 100;
const audioView = (lang) => ({
  id: audioSeq++,
  source: 'UPLOAD',
  format: 'wav',
  mimeType: 'audio/wav',
  sizeBytes: 40044,
  sha256: `mock-${lang}`,
  contentVersion: 1,
  status: 'READY',
  current: true,
  url: AUDIO_URI,
  createdAt: '2026-10-01T08:00:00Z',
});

const img = (label, a, b) => svgImageDataUri(`[DEMO] ${label}`, a, b);

/** Internal fixture shape; handlers.js maps it onto the public API DTOs. */
export const MOCK_POIS = [
  {
    id: 1,
    code: 'DEMO-BEN-DUOC',
    latitude: 11.143,
    longitude: 106.4618,
    category: 'Di tích lịch sử',
    triggerRadius: 120,
    cover: img('Địa đạo Bến Dược', '#4f5d3a', '#293526'),
    images: [img('Địa đạo Bến Dược', '#4f5d3a', '#293526'), img('Lối vào hầm', '#795548', '#a65f3b')],
    updatedAt: '2026-10-18T09:30:00Z',
    translations: [
      {
        languageCode: 'vi',
        name: '[DEMO] Địa đạo Bến Dược',
        description: 'Khu di tích thuộc hệ thống địa đạo Củ Chi, nơi tái hiện cuộc sống và chiến đấu trong lòng đất.',
        narrationText:
          'Chào mừng bạn đến với khu di tích địa đạo Bến Dược. Đây là một phần của hệ thống địa đạo Củ Chi huyền thoại, được quân và dân miền Nam Việt Nam xây dựng trong thời kỳ kháng chiến. Hệ thống địa đạo gồm nhiều tầng sâu xuống lòng đất, có nơi ăn, ở, họp hành, chữa bệnh và chiến đấu. Hãy cùng khám phá những đoạn hầm được tái hiện và nghe kể về những năm tháng lịch sử tại nơi đây.',
        audio: true,
      },
      {
        languageCode: 'en',
        name: '[DEMO] Ben Duoc Tunnels',
        description: 'A memorial site within the Cu Chi tunnel network, recreating underground wartime life.',
        narrationText:
          'Welcome to the Ben Duoc tunnels memorial site. This place is part of the legendary Cu Chi tunnel network built during the war. The tunnels stretched for hundreds of kilometres and contained living quarters, meeting rooms, hospitals and fighting positions. As you walk through the reconstructed sections, imagine the resilience of the people who lived and worked underground for years.',
        audio: true,
      },
    ],
  },
  {
    id: 2,
    code: 'DEMO-DEN-BEN-DUOC',
    latitude: 11.1438,
    longitude: 106.4605,
    category: 'Đền thờ',
    triggerRadius: 80,
    cover: img('Đền thờ Bến Dược', '#a65f3b', '#795548'),
    images: [img('Đền thờ Bến Dược', '#a65f3b', '#795548')],
    updatedAt: '2026-10-17T15:00:00Z',
    translations: [
      {
        languageCode: 'vi',
        name: '[DEMO] Đền thờ liệt sĩ Bến Dược',
        description: 'Đền thờ tưởng niệm các anh hùng liệt sĩ đã hy sinh tại chiến khu Củ Chi.',
        narrationText:
          'Trước mắt bạn là đền thờ liệt sĩ Bến Dược, nơi tưởng nhớ hàng nghìn anh hùng đã ngã xuống vì độc lập dân tộc. Kiến trúc đền mang hình búp sen hướng lên trời. Mỗi năm vào các ngày lễ tưởng niệm, đông đảo người dân và cựu chiến binh về đây dâng hương tri ân.',
        audio: true,
      },
      {
        languageCode: 'en',
        name: '[DEMO] Ben Duoc Martyrs Memorial',
        description: 'A memorial temple honouring heroes who fell in the Cu Chi resistance base.',
        narrationText:
          'This is the Ben Duoc Martyrs Memorial, built to honour thousands of heroes who sacrificed their lives. The temple is shaped like a lotus bud rising skyward. Every year on memorial days, veterans and local families return here to offer incense and gratitude.',
        audio: false,
      },
    ],
  },
  {
    id: 3,
    code: 'DEMO-TRUONG-BAN',
    latitude: 11.128,
    longitude: 106.4925,
    category: 'Di tích lịch sử',
    triggerRadius: 100,
    cover: img('Trường bắn Củ Chi', '#795548', '#293526'),
    images: [img('Trường bắn Củ Chi', '#795548', '#293526')],
    updatedAt: '2026-10-10T10:00:00Z',
    translations: [
      {
        languageCode: 'vi',
        name: '[DEMO] Trường bắn Củ Chi',
        description: 'Khu trường bắn phục vụ tham quan và trải nghiệm tại huyện Củ Chi.',
        narrationText:
          'Bạn đang đứng tại khu trường bắn Củ Chi. Trong thời chiến, đây là khu vực diễn ra nhiều trận đánh ác liệt. Ngày nay, một phần được giữ lại để du khách tìm hiểu và trải nghiệm. Vui lòng tuân thủ hướng dẫn an toàn của khu di tích khi tham quan khu vực này.',
        audio: true,
      },
    ],
  },
  {
    id: 4,
    code: 'DEMO-BEN-DINH',
    latitude: 11.0598,
    longitude: 106.5281,
    category: 'Di tích lịch sử',
    triggerRadius: 120,
    cover: img('Địa đạo Bến Đình', '#4f5d3a', '#a65f3b'),
    images: [img('Địa đạo Bến Đình', '#4f5d3a', '#a65f3b'), img('Hầm chữa bệnh', '#293526', '#795548')],
    updatedAt: '2026-10-15T08:00:00Z',
    translations: [
      {
        languageCode: 'vi',
        name: '[DEMO] Địa đạo Bến Đình',
        description: 'Cổng vào của hệ thống địa đạo Củ Chi, gần trung tâm huyện Củ Chi.',
        narrationText:
          'Xin chào! Bạn đang ở điểm tham quan địa đạo Bến Đình, một trong những cổng vào chính của hệ thống địa đạo Củ Chi. Từ đây, hướng dẫn viên sẽ đưa bạn xuống tham quan một đoạn địa đạo đã được nới rộng cho du khách. Hãy cúi người thấp và đi theo hàng một, lối đi khá hẹp so với sinh hoạt bình thường.',
        audio: true,
      },
      {
        languageCode: 'en',
        name: '[DEMO] Ben Dinh Tunnels',
        description: 'An original entrance to the Cu Chi tunnel network, close to Cu Chi town.',
        narrationText:
          'Hello! You are at the Ben Dinh tunnels, one of the main entrances to the Cu Chi tunnel network. From here a guide will take you down into a section of the tunnels that has been widened for visitors. Please bend low and walk in single file; the passage is narrow compared with everyday life above ground.',
        audio: false,
      },
    ],
  },
  {
    id: 5,
    code: 'DEMO-VUON-CAO-SU',
    latitude: 11.115,
    longitude: 106.47,
    category: 'Thiên nhiên',
    triggerRadius: 60,
    cover: img('Vườn cao su cổ', '#a65f3b', '#f3eacd'),
    images: [img('Vườn cao su cổ', '#a65f3b', '#f3eacd')],
    updatedAt: '2026-09-28T12:00:00Z',
    translations: [
      {
        languageCode: 'vi',
        name: '[DEMO] Vườn cao su cổ',
        description: 'Điểm dừng chân mát mẻ với hàng cao su trên trăm năm tuổi (nội dung minh hoạ).',
        narrationText:
          'Bạn đang dừng chân tại vườn cao su cổ (nội dung minh hoạ cho bản demo). Buổi sáng sớm, sương còn giăng trên các tán lá, tiếng gió qua vườn tạo âm thanh rất đặc trưng. Đây là điểm dừng nghỉ phù hợp trước khi tiếp tục hành trình tham quan các địa điểm lân cận.',
        audio: false,
      },
      {
        languageCode: 'en',
        name: '[DEMO] Old Rubber Grove',
        description: 'A shady rest stop under century-old rubber trees (illustrative demo content).',
        narrationText:
          'You are resting at the old rubber grove (illustrative demo content). In the early morning, mist still hangs over the canopy and the wind produces a very distinctive sound. This is a good resting point before continuing to nearby sites.',
        audio: false,
      },
    ],
  },
];

export { audioView };
