/**
 * End-to-end check of the admin POI/translation/media flow against a REAL backend + database,
 * plus the public (User web) API that must see the same data.
 *
 *   E2E_BASE_URL=http://127.0.0.1:8080 \
 *   E2E_ADMIN_USERNAME=admin01 E2E_ADMIN_PASSWORD=123456 \
 *   npm run verify:e2e
 *
 * Optional: E2E_SUPER_USERNAME / E2E_SUPER_PASSWORD enables the "Super Admin must not manage POI"
 * authorization check; without them that step is reported as SKIP.
 * Created POIs are soft-deleted at the end; nothing else is touched.
 */
import { randomUUID } from 'node:crypto';

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const ADMIN = { username: process.env.E2E_ADMIN_USERNAME || 'admin01', password: process.env.E2E_ADMIN_PASSWORD || '123456' };
const SUPER = process.env.E2E_SUPER_USERNAME
  ? { username: process.env.E2E_SUPER_USERNAME, password: process.env.E2E_SUPER_PASSWORD }
  : null;

const results = [];
let createdIds = [];
let token = null;
let grant = null; // { accessToken, deviceId } — visitor access for /api/v1/public/**
let qrId = null;

function check(name, condition, detail = '') {
  results.push({ name, ok: !!condition, detail });
  if (!condition) throw new Error(`${name}${detail ? ' — ' + detail : ''}`);
  }

async function api(path, { method = 'GET', body, form, auth = token, visitor = false, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (visitor) {
    // Public visitor APIs require a redeemed grant token bound to the device id.
    if (!grant) throw new Error('visitor access requested before a grant was redeemed');
    h.Authorization = `Bearer ${grant.accessToken}`;
    h['X-Device-Id'] = grant.deviceId;
  } else if (auth) {
    h.Authorization = `Bearer ${auth}`;
  }
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json().catch(() => null) : await res.arrayBuffer();
  return { status: res.status, data, type, headers: res.headers };
}

async function expectStatus(path, want, opts) {
  const r = await api(path, opts);
  check(`${opts?.method || 'GET'} ${path} → ${want}`, r.status === want, `nhận ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  return r;
}

/** 1x1 transparent PNG. */
function png() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

/** Minimal 8 kHz mono 8-bit PCM WAV (valid RIFF header, so magic-byte detection accepts it). */
function wav() {
  const samples = 8000;
  const b = Buffer.alloc(44 + samples);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + samples, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(8000, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples, 40);
  b.fill(128, 44);
  return b;
}

function fileForm(bytes, filename, type) {
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type }), filename);
  return fd;
}

const suffix = randomUUID().slice(0, 8).toUpperCase();
const CODE = `E2E-${suffix}`;
const DRAFT_CODE = `E2E-${suffix}-DRAFT`;

async function main() {
  // ---- 1. Authentication -------------------------------------------------
  const login = await expectStatus('/api/v1/auth/login', 200, {
    method: 'POST',
    body: ADMIN,
    auth: null,
  });
  token = login.data.accessToken;
  check('login trả bearer token + role ADMIN', !!token && login.data.account?.role === 'ADMIN');
  const me = await expectStatus('/api/v1/auth/me', 200);
  check('GET /auth/me khớp tài khoản đăng nhập', me.data.username === ADMIN.username, me.data.username);
  await expectStatus('/api/v1/admin/pois', 401, { auth: null });

  // ---- 2. Languages come from the API, not the client --------------------
  const langs = await expectStatus('/api/v1/admin/languages', 200);
  check('có danh sách ngôn ngữ từ backend (>=1)', Array.isArray(langs.data) && langs.data.length > 0);
  const codes = langs.data.map((l) => l.code);
  check('backend hỗ trợ vi và en cho luồng kiểm thử', codes.includes('vi') && codes.includes('en'), codes.join(','));

  // ---- 3. Create POI -----------------------------------------------------
  const initial = {
    code: CODE,
    defaultName: `POI kiểm thử ${suffix}`,
    latitude: 11.1429,
    longitude: 106.4625,
    category: 'Di tích lịch sử',
    triggerRadius: 80,
  };
  const created = await expectStatus('/api/v1/admin/pois', 201, { method: 'POST', body: initial });
  const id = created.data.id;
  createdIds.push(id);
  check('POI mới ở trạng thái nháp', created.data.status === 'DRAFT', created.data.status);

  // ---- 4. Read back (persistence) ---------------------------------------
  let poi = (await expectStatus(`/api/v1/admin/pois/${id}`, 200)).data;
  check('đọc lại POI: mã/tên/toạ độ khớp dữ liệu gửi lên',
    poi.code === initial.code && poi.defaultName === initial.defaultName
    && poi.latitude === initial.latitude && poi.longitude === initial.longitude);
  check('POI mới chưa có ảnh, audio, bản dịch', (poi.images ?? []).length === 0 && poi.translations.length === 0);

  // ---- 5. Update + optimistic-lock conflict ------------------------------
  const rowVersion = poi.rowVersion;
  const updated = (await expectStatus(`/api/v1/admin/pois/${id}`, 200, {
    method: 'PUT',
    body: { ...initial, defaultName: `${initial.defaultName} (sửa)`, triggerRadius: 120, rowVersion },
  })).data;
  check('sửa POI: trả về dữ liệu mới + tăng rowVersion',
    updated.defaultName.endsWith('(sửa)') && updated.triggerRadius === 120 && updated.rowVersion > rowVersion);
  const stale = await api(`/api/v1/admin/pois/${id}`, {
    method: 'PUT',
    body: { ...initial, defaultName: 'Ghi đè cũ', rowVersion },
  });
  check('rowVersion cũ bị từ chối 409 CONFLICT', stale.status === 409 && stale.data?.code === 'CONFLICT',
    `${stale.status} ${stale.data?.code}`);

  // ---- 6. Validation -----------------------------------------------------
  const bad = await api('/api/v1/admin/pois', {
    method: 'POST',
    body: { code: 'bad code', defaultName: '', latitude: 91, longitude: 200 },
  });
  check('dữ liệu sai → 400 VALIDATION_FAILED kèm fieldErrors',
    bad.status === 400 && bad.data?.code === 'VALIDATION_FAILED' && bad.data.fieldErrors?.length > 0,
    `${bad.status} ${bad.data?.code}`);
  const dup = await api('/api/v1/admin/pois', { method: 'POST', body: initial });
  check('mã POI trùng → 409 CONFLICT', dup.status === 409 && dup.data?.code === 'CONFLICT', `${dup.status} ${dup.data?.code}`);

  // ---- 7. Translations ---------------------------------------------------
  const vi = (await expectStatus(`/api/v1/admin/pois/${id}/translations/vi`, 200, {
    method: 'PUT',
    body: { name: 'Địa đạo kiểm thử', description: 'Mô tả tiếng Việt', narrationText: 'Thuyết minh tiếng Việt.' },
  })).data;
  check('lưu bản dịch tiếng Việt (contentVersion 1)', vi.languageCode === 'vi' && vi.contentVersion === 1);
  const enText = `English narration ${suffix}.`;
  const en = (await expectStatus(`/api/v1/admin/pois/${id}/translations/en`, 200, {
    method: 'PUT',
    body: { name: 'Test tunnel', description: 'English description', narrationText: enText },
  })).data;
  check('lưu bản dịch tiếng Anh', en.languageCode === 'en' && en.narrationText === enText);
  await expectStatus(`/api/v1/admin/pois/${id}/translations/fr`, 404, {
    method: 'PUT',
    body: { name: 'x', narrationText: 'x' },
  });
  const enEmpty = await api(`/api/v1/admin/pois/${id}/translations/en`, {
    method: 'PUT',
    body: { name: '', narrationText: '' },
  });
  check('bản dịch rỗng bị từ chối 400', enEmpty.status === 400, `${enEmpty.status}`);

  // ---- 8. Image upload ---------------------------------------------------
  const pngBytes = png();
  const imgUp = await api(`/api/v1/admin/pois/${id}/image`, { method: 'POST', form: fileForm(pngBytes, 'e2e.png', 'image/png') });
  check('tải ảnh PNG thành công', imgUp.status === 200 && imgUp.data?.images?.length === 1,
    `${imgUp.status} ${imgUp.data?.message ?? ''}`);
  poi = imgUp.data;
  const imageUrl = poi.images[0].url;
  const imgFetch = await api(imageUrl, { headers: { Accept: '*/*' }, auth: token });
  check('ảnh tải lại đúng bytes từ backend', imgFetch.status === 200 && Buffer.from(imgFetch.data).equals(pngBytes),
    `status ${imgFetch.status}`);
  const badFile = await api(`/api/v1/admin/pois/${id}/image`, {
    method: 'POST',
    form: fileForm(Buffer.from('not-an-image-at-all'), 'fake.png', 'image/png'),
  });
  check('file không phải ảnh → 415 UNSUPPORTED_MEDIA', badFile.status === 415 && badFile.data?.code === 'UNSUPPORTED_MEDIA',
    `${badFile.status} ${badFile.data?.code}`);

  // ---- 9. Audio upload + publish readiness -------------------------------
  const publishTooEarly = await api(`/api/v1/admin/pois/${id}/publish`, { method: 'POST' });
  check('công khai khi chưa có audio tiếng Anh → 409 PUBLISH_NOT_READY',
    publishTooEarly.status === 409 && publishTooEarly.data?.code === 'PUBLISH_NOT_READY',
    `${publishTooEarly.status} ${publishTooEarly.data?.code}`);

  const wavBytes = wav();
  const audioUp = await api(`/api/v1/admin/pois/${id}/translations/en/audio`, {
    method: 'POST',
    form: fileForm(wavBytes, 'narration-en.wav', 'audio/wav'),
  });
  check('tải audio WAV tiếng Anh thành công', audioUp.status === 201 && audioUp.data?.status === 'READY',
    `${audioUp.status} ${audioUp.data?.message ?? ''}`);
  const adminAudio = await api(audioUp.data.url, { headers: { Accept: '*/*' } });
  check('audio quản trị tải lại đúng bytes', adminAudio.status === 200 && Buffer.from(adminAudio.data).equals(wavBytes));

  const published = await expectStatus(`/api/v1/admin/pois/${id}/publish`, 200, { method: 'POST' });
  check('công khai POI thành công sau khi đủ nội dung + audio', published.data.status === 'PUBLISHED');

  // ---- 10. User web (public) contract --------------------------------
  // Public visitor APIs are NOT open: without a redeemed grant they must reject.
  const noGrant = await api(`/api/v1/public/pois?page=0&size=100`, { auth: null });
  check('public list không có grant → 401 ACCESS_REQUIRED',
    noGrant.status === 401 && noGrant.data?.code === 'ACCESS_REQUIRED', `${noGrant.status} ${noGrant.data?.code}`);

  // Real UC02 flow: admin issues a one-time QR, the visitor redeems it for a device-bound grant.
  const qr = (await expectStatus('/api/v1/admin/access-qrs', 201, {
    method: 'POST', body: { note: `E2E ${suffix}` },
  })).data;
  check('tạo QR truy cập nhận qrToken (hiện đúng một lần)', !!qr.qrToken && qr.status === 'ISSUED');
  qrId = qr.id;
  grant = { accessToken: null, deviceId: `e2e-device-${suffix.replace(/-/g, '')}` };
  const redeemed = await expectStatus('/api/v1/public/access/redeem', 200, {
    method: 'POST', auth: null, body: { qrToken: qr.qrToken, deviceId: grant.deviceId },
  });
  grant.accessToken = redeemed.data.accessToken;
  check('redeem QR nhận grant token có thời hạn', !!grant.accessToken && redeemed.data.expiresAt != null);
  const grantMe = await expectStatus('/api/v1/public/access/me', 200, { visitor: true });
  check('GET /public/access/me trả trạng thái grant', grantMe.data.remainingSeconds > 0);
  const grantOnAccount = await api('/api/v1/auth/me', { auth: grant.accessToken, headers: { 'X-Device-Id': grant.deviceId } });
  check('grant của visitor không dùng được trên API tài khoản (/auth/me)', grantOnAccount.status === 401 || grantOnAccount.status === 403,
    `${grantOnAccount.status}`);
  const reused = await api('/api/v1/public/access/redeem', {
    method: 'POST', auth: null, body: { qrToken: qr.qrToken, deviceId: grant.deviceId },
  });
  check('redeem QR lần hai → bị từ chối (QR một lần)', reused.status === 409 || reused.status === 400,
    `${reused.status} ${reused.data?.code}`);

  const publicList = await expectStatus(`/api/v1/public/pois?page=0&size=100&lang=en`, 200, { visitor: true });
  const inList = publicList.data.items.find((p) => p.id === id);
  check('POI đã công khai xuất hiện trong danh sách public', !!inList);
  check('danh sách public trả tên theo ngôn ngữ yêu cầu', inList.name === 'Test tunnel', inList.name);
  check('danh sách public có URL ảnh tương đối', inList.imageUrl === `/api/v1/public/pois/${id}/image`, inList.imageUrl);

  const detailEn = (await expectStatus(`/api/v1/public/pois/${id}?lang=en`, 200, { visitor: true })).data;
  check('chi tiết public: ngôn ngữ + nội dung khớp bản dịch đã lưu',
    detailEn.language === 'en' && detailEn.fallback === false && detailEn.narrationText === enText);
  check('chi tiết public có metadata audio hiện hành',
    detailEn.audio?.url === `/api/v1/public/audio/${audioUp.data.id}` && detailEn.audio.contentVersion === 1,
    JSON.stringify(detailEn.audio));
  check('chi tiết public liệt kê đủ ngôn ngữ có nội dung',
    detailEn.availableLanguages?.includes('vi') && detailEn.availableLanguages?.includes('en'));

  const publicAudio = await api(detailEn.audio.url, { headers: { Accept: '*/*' }, visitor: true });
  check('audio public phát được đúng bytes', publicAudio.status === 200 && Buffer.from(publicAudio.data).equals(wavBytes));
  const publicImage = await api(detailEn.imageUrl, { headers: { Accept: '*/*' }, visitor: true });
  check('ảnh public tải được', publicImage.status === 200 && Buffer.from(publicImage.data).equals(pngBytes));

  const fallback = (await expectStatus(`/api/v1/public/pois/${id}?lang=fr`, 200, { visitor: true })).data;
  check('ngôn ngữ chưa có bản dịch → fallback=true về ngôn ngữ mặc định',
    fallback.fallback === true && fallback.language === 'vi', `${fallback.language} ${fallback.fallback}`);

  const manifest = (await expectStatus(`/api/v1/public/pois/${id}/offline-manifest`, 200, { visitor: true })).data;
  const enOffline = manifest.translations.find((t) => t.languageCode === 'en');
  check('manifest ngoại tuyến chứa bản dịch + sha256 audio',
    enOffline?.narrationText === enText && enOffline.audio?.sha256?.length === 64 && !!manifest.manifestVersion);

  // ---- 11. Draft is invisible to User web ----------------------------
  const draft = (await expectStatus('/api/v1/admin/pois', 201, {
    method: 'POST',
    body: { code: DRAFT_CODE, defaultName: 'POI nháp', latitude: 11.1, longitude: 106.4 },
  })).data;
  createdIds.push(draft.id);
  await expectStatus(`/api/v1/public/pois/${draft.id}`, 404, { visitor: true });
  check('POI nháp không có trong danh sách public',
    !(await api('/api/v1/public/pois?page=0&size=100', { visitor: true })).data.items.some((p) => p.id === draft.id));

  // ---- 12. Unpublish hides content again --------------------------------
  const unpublished = await expectStatus(`/api/v1/admin/pois/${id}/unpublish`, 200, { method: 'POST' });
  check('gỡ công khai → DRAFT', unpublished.data.status === 'DRAFT');
  await expectStatus(`/api/v1/public/pois/${id}`, 404, { visitor: true });
  const hiddenAudio = await api(`/api/v1/public/audio/${audioUp.data.id}`, { headers: { Accept: '*/*' }, visitor: true });
  check('audio của POI đã gỡ công khai không còn truy cập được', hiddenAudio.status === 404, `${hiddenAudio.status}`);

  // ---- 13. Soft delete ---------------------------------------------------
  await expectStatus(`/api/v1/admin/pois/${draft.id}`, 204, { method: 'DELETE' });
  await expectStatus(`/api/v1/admin/pois/${draft.id}`, 404);
  const search = await api(`/api/v1/admin/pois?page=0&size=100&q=${encodeURIComponent(DRAFT_CODE)}`);
  check('POI đã xoá mềm không còn trong danh sách quản trị', search.data.items.length === 0,
    `items=${search.data.items.length}`);

  // ---- 14. Authorization: role rules ------------------------------------
  if (!SUPER) {
    results.push({ name: 'Super Admin không quản lý POI (403)', ok: null, detail: 'SKIP: chưa cấu hình E2E_SUPER_USERNAME' });
  } else {
    const suLogin = await api('/api/v1/auth/login', { method: 'POST', body: SUPER, auth: null });
    check('đăng nhập Super Admin', suLogin.status === 200 && suLogin.data.account.role === 'SUPER_ADMIN',
      `${suLogin.status}`);
    const suMe = await api('/api/v1/auth/me', { auth: suLogin.data.accessToken });
    check('Super Admin dùng được /auth/me', suMe.status === 200);
    const suPois = await api('/api/v1/admin/pois', { auth: suLogin.data.accessToken });
    check('Super Admin bị từ chối quản lý POI (403 FORBIDDEN)',
      suPois.status === 403 && suPois.data?.code === 'FORBIDDEN', `${suPois.status} ${suPois.data?.code}`);
    const suPublish = await api(`/api/v1/admin/pois/${id}/publish`, { method: 'POST', auth: suLogin.data.accessToken });
    check('Super Admin bị từ chối công khai POI (403)', suPublish.status === 403, `${suPublish.status}`);
  }

  // ---- 15. Revoking the QR kills the visitor grant ------------------------
  await expectStatus(`/api/v1/admin/access-qrs/${qr.id}/revoke`, 200, { method: 'POST' });
  const revokedAccess = await api(`/api/v1/public/pois?page=0&size=100`, { visitor: true });
  check('thu hồi QR → grant không còn tác dụng (401)', revokedAccess.status === 401,
    `${revokedAccess.status} ${revokedAccess.data?.code}`);
}

async function cleanup() {
  if (!token) return;
  for (const id of createdIds) {
    await api(`/api/v1/admin/pois/${id}`, { method: 'DELETE' }).catch(() => {});
  }
  if (qrId) {
    await api(`/api/v1/admin/access-qrs/${qrId}/revoke`, { method: 'POST' }).catch(() => {});
  }
}

try {
  await main();
} catch (error) {
  check('luồng chạy hoàn tất', false, error.message);
} finally {
  await cleanup();
  const failed = results.filter((r) => r.ok === false);
  const skipped = results.filter((r) => r.ok === null);
  for (const r of results) {
    const mark = r.ok === true ? 'PASS' : r.ok === null ? 'SKIP' : 'FAIL';
    console.log(`${mark}  ${r.name}${r.detail && r.ok !== true ? `  [${r.detail}]` : ''}`);
  }
  console.log(`\n${results.length - failed.length - skipped.length} PASS · ${failed.length} FAIL · ${skipped.length} SKIP`);
  process.exit(failed.length ? 1 : 0);
}
