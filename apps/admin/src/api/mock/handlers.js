import { ApiError } from '../client.js';
import { TONE_SIZE, audioBlob, db, imageBlob, newAudio, nextId, persist, saveBlob } from './db.js';
import { LANGUAGES, TTS_STATUS } from './fixtures.js';

/**
 * Fake backend for UI work without a database. Enabled by VITE_USE_MOCK=true (see src/config.js).
 * Every route returns the same shape and error codes as the real API (docs/USE_CASES.md),
 * so switching back to the backend needs no UI change.
 *
 * Built-in test switches:
 * - Login password "wrong"        → 401 INVALID_CREDENTIALS
 * - Narration text containing "#fail" → the TTS job ends FAILED
 */

// ---------- Router ----------

const routes = [];

function on(method, pattern, handler) {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)'))}$`);
  routes.push({ method, re, keys, handler });
}

export async function mockRequest(path, { method = 'GET', body, formData, signal, raw = false } = {}) {
  const [pathname, search = ''] = path.split('?');
  await delay(raw ? 50 : 200 + Math.random() * 300, signal);
  advanceJobs();
  const route = routes.find((r) => r.method === method && r.re.test(pathname));
  if (!route) {
    console.warn(`[mock] chưa có route cho ${method} ${pathname}`);
    throw fail(404, 'NOT_FOUND', `Mock chưa hỗ trợ ${method} ${pathname}`);
  }
  const match = pathname.match(route.re);
  const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
  try {
    const result = route.handler({ params, query: new URLSearchParams(search), body, formData });
    persist();
    console.debug('[mock]', method, path, result);
    if (raw) return result;
    return result == null ? null : structuredClone(result);
  } catch (e) {
    console.debug('[mock]', method, path, '→', e.status, e.code, e.message);
    throw e;
  }
}

/** Minimal Response stand-in for raw media requests (callers only use .blob()). */
function mediaResponse(blob) {
  return { ok: true, status: 200, headers: new Headers({ 'Content-Type': blob.type }), blob: async () => blob };
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) return abort();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => (clearTimeout(t), abort()), { once: true });
  });
}

// ---------- Helpers ----------

const now = () => new Date().toISOString();

function fail(status, code, message, fieldErrors) {
  return new ApiError({ status, code, message, fieldErrors });
}

function validation(errors) {
  return fail(400, 'VALIDATION_FAILED', 'Dữ liệu không hợp lệ', errors.map(([field, message]) => ({ field, message })));
}

function requirePoi(id) {
  const poi = db.pois.find((p) => p.id === Number(id) && !p.deleted);
  if (!poi) throw fail(404, 'NOT_FOUND', 'Không tìm thấy địa điểm');
  return poi;
}

function requireLanguage(code) {
  if (!LANGUAGES.some((l) => l.code === code)) throw fail(404, 'NOT_FOUND', `Ngôn ngữ '${code}' không được hỗ trợ`);
}

function requireTranslation(poi, lang) {
  requireLanguage(lang);
  const t = poi.translations.find((x) => x.languageCode === lang);
  if (!t) throw fail(404, 'NOT_FOUND', 'Chưa có nội dung cho ngôn ngữ này');
  return t;
}

function touch(poi) {
  poi.updatedAt = now();
  poi.rowVersion += 1;
}

function currentAudio(poi, t) {
  return (
    db.audios
      .filter((a) => a.poiId === poi.id && a.languageCode === t.languageCode && a.contentVersion === t.contentVersion && a.status === 'READY')
      .at(-1) ?? null
  );
}

function latestJob(poiId, lang) {
  return db.jobs.filter((j) => j.poiId === poiId && j.languageCode === lang).at(-1) ?? null;
}

// ---------- Views (same shape as backend DTOs) ----------

function audioView(a) {
  if (!a) return null;
  const { poiId: _p, languageCode: _l, ...rest } = a;
  return { ...rest, current: true, url: `/api/v1/admin/audio/${a.id}` };
}

function jobView(j, reusedExisting = false) {
  if (!j) return null;
  const { poiId: _p, audioId, ...rest } = j;
  return { ...rest, audio: audioView(db.audios.find((a) => a.id === audioId)), reusedExisting };
}

function readiness(poi, t) {
  if (currentAudio(poi, t)) return 'READY';
  const job = latestJob(poi.id, t.languageCode);
  if (!job || job.contentVersion !== t.contentVersion) return 'NONE';
  return { QUEUED: 'PROCESSING', RUNNING: 'PROCESSING', FAILED: 'FAILED' }[job.status] ?? 'NONE';
}

const byLang = (a, b) => a.languageCode.localeCompare(b.languageCode);

function summary(poi) {
  const { id, code, defaultName, latitude, longitude, category, triggerRadius, status, demo, updatedAt } = poi;
  return {
    id, code, defaultName, latitude, longitude, category, triggerRadius, status, demo, updatedAt,
    languages: [...poi.translations].sort(byLang).map((t) => ({ languageCode: t.languageCode, hasContent: true, audio: readiness(poi, t) })),
  };
}

function detail(poi) {
  const images = [...poi.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({ id: i.id, url: `/api/v1/admin/pois/${poi.id}/images/${i.id}`, mimeType: i.mimeType, sortOrder: i.sortOrder }));
  const { deleted: _d, images: _i, translations, ...base } = poi;
  return {
    ...base,
    imageUrl: images.length ? `/api/v1/admin/pois/${poi.id}/image` : null,
    images,
    translations: [...translations].sort(byLang).map((t) => ({
      ...t,
      currentAudio: audioView(currentAudio(poi, t)),
      latestJob: jobView(latestJob(poi.id, t.languageCode)),
    })),
  };
}

// ---------- Auth ----------

const ACCOUNT = { id: 1, username: 'admin', displayName: 'Quản trị viên (mock)', role: 'SUPER_ADMIN' };

on('POST', '/api/v1/auth/login', ({ body }) => {
  const errors = [];
  if (!body?.username?.trim()) errors.push(['username', 'Tên đăng nhập là bắt buộc']);
  if (!body?.password) errors.push(['password', 'Mật khẩu là bắt buộc']);
  if (errors.length) throw validation(errors);
  if (body.password === 'wrong') throw fail(401, 'INVALID_CREDENTIALS', 'Sai tên đăng nhập hoặc mật khẩu');
  return {
    accessToken: `mock-token-${Date.now()}`,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 8 * 3_600_000).toISOString(),
    account: { ...ACCOUNT, username: body.username.trim() },
  };
});
on('POST', '/api/v1/auth/logout', () => null);
on('GET', '/api/v1/auth/me', () => ACCOUNT);

// ---------- Languages & TTS status ----------

on('GET', '/api/v1/admin/languages', () => LANGUAGES);
on('GET', '/api/v1/admin/tts/status', () => TTS_STATUS);

// ---------- UC02 access QR codes ----------

const qrSummary = ({ token: _t, ...qr }) => qr;
const qrList = () => (db.accessQrs ??= []);

on('GET', '/api/v1/admin/access-qrs', ({ query }) => {
  const page = Number(query.get('page') || 0);
  const size = Number(query.get('size') || 20);
  const status = query.get('status');
  const items = qrList().filter((q) => !status || q.status === status).slice().reverse();
  return {
    items: items.slice(page * size, page * size + size).map(qrSummary),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / size),
  };
});

on('POST', '/api/v1/admin/access-qrs', ({ body }) => {
  const token = `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const qr = {
    id: nextId(),
    status: 'ISSUED',
    packageCode: 'DEMO_24H',
    durationMinutes: 1440,
    note: body?.note?.trim() || null,
    createdAt: now(),
    redeemedAt: null,
    revokedAt: null,
    token,
  };
  qrList().push(qr);
  return { ...qrSummary(qr), qrToken: token, activationUrl: `https://multitional-translator-web.pages.dev/activate?t=${token}` };
});

on('POST', '/api/v1/admin/access-qrs/:id/revoke', ({ params }) => {
  const qr = qrList().find((q) => q.id === Number(params.id));
  if (!qr) throw fail(404, 'NOT_FOUND', 'Mã QR không tồn tại');
  if (qr.status !== 'REVOKED') Object.assign(qr, { status: 'REVOKED', revokedAt: now() });
  return qrSummary(qr);
});

// ---------- POI ----------

on('GET', '/api/v1/admin/pois', ({ query }) => {
  const page = Number(query.get('page') || 0);
  const size = Number(query.get('size') || 20);
  const status = query.get('status');
  const q = (query.get('q') || '').toLowerCase();
  const rows = db.pois
    .filter((p) => !p.deleted)
    .filter((p) => !status || p.status === status)
    .filter((p) => !q || p.defaultName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    items: rows.slice(page * size, page * size + size).map(summary),
    page,
    size,
    totalItems: rows.length,
    totalPages: Math.ceil(rows.length / size),
  };
});

function validatePoi(b) {
  const e = [];
  if (!b.code?.trim()) e.push(['code', 'Mã địa điểm là bắt buộc']);
  else if (!/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(b.code)) e.push(['code', "Mã chỉ gồm chữ IN HOA, số, '-' hoặc '_' (2–50 ký tự)"]);
  if (!b.defaultName?.trim()) e.push(['defaultName', 'Tên mặc định là bắt buộc']);
  if (b.latitude == null || Number.isNaN(b.latitude)) e.push(['latitude', 'Vĩ độ là bắt buộc']);
  else if (b.latitude < -90 || b.latitude > 90) e.push(['latitude', 'Vĩ độ phải trong khoảng -90..90']);
  if (b.longitude == null || Number.isNaN(b.longitude)) e.push(['longitude', 'Kinh độ là bắt buộc']);
  else if (b.longitude < -180 || b.longitude > 180) e.push(['longitude', 'Kinh độ phải trong khoảng -180..180']);
  if (b.category && b.category.length > 100) e.push(['category', 'Danh mục tối đa 100 ký tự']);
  if (b.triggerRadius != null && (b.triggerRadius < 1 || b.triggerRadius > 5000)) {
    e.push(['triggerRadius', 'Bán kính kích hoạt phải từ 1 đến 5000 mét']);
  }
  if (e.length) throw validation(e);
}

function assertCodeFree(code, exceptId) {
  if (db.pois.some((p) => p.code === code && p.id !== exceptId)) {
    throw fail(409, 'CONFLICT', `Mã địa điểm '${code}' đã tồn tại`);
  }
}

on('POST', '/api/v1/admin/pois', ({ body }) => {
  validatePoi(body);
  assertCodeFree(body.code);
  const poi = {
    id: nextId(),
    code: body.code,
    defaultName: body.defaultName.trim(),
    latitude: body.latitude,
    longitude: body.longitude,
    category: body.category || null,
    triggerRadius: body.triggerRadius ?? 50,
    status: 'DRAFT',
    demo: false,
    deleted: false,
    publishedAt: null,
    createdAt: now(),
    updatedAt: now(),
    rowVersion: 0,
    images: [],
    translations: [],
  };
  db.pois.push(poi);
  return detail(poi);
});

on('GET', '/api/v1/admin/pois/:id', ({ params }) => detail(requirePoi(params.id)));

on('PUT', '/api/v1/admin/pois/:id', ({ params, body }) => {
  const poi = requirePoi(params.id);
  if (body.rowVersion != null && body.rowVersion !== poi.rowVersion) {
    throw fail(409, 'CONFLICT', 'Địa điểm đã được người khác cập nhật, vui lòng tải lại');
  }
  validatePoi(body);
  assertCodeFree(body.code, poi.id);
  Object.assign(poi, {
    code: body.code,
    defaultName: body.defaultName.trim(),
    latitude: body.latitude,
    longitude: body.longitude,
    category: body.category || null,
    triggerRadius: body.triggerRadius ?? poi.triggerRadius,
  });
  touch(poi);
  return detail(poi);
});

on('DELETE', '/api/v1/admin/pois/:id', ({ params }) => {
  const poi = requirePoi(params.id);
  poi.deleted = true; // soft delete: hidden from lists, data kept
  touch(poi);
  return null;
});

on('POST', '/api/v1/admin/pois/:id/publish', ({ params }) => {
  const poi = requirePoi(params.id);
  const en = poi.translations.find((t) => t.languageCode === 'en');
  if (!en) throw fail(409, 'PUBLISH_NOT_READY', 'Cần lưu nội dung tiếng Anh trước khi công khai POI');
  if (!currentAudio(poi, en)) {
    throw fail(409, 'PUBLISH_NOT_READY', 'Cần có audio tiếng Anh ở trạng thái sẵn sàng trước khi công khai POI');
  }
  poi.status = 'PUBLISHED';
  poi.publishedAt = now();
  touch(poi);
  return detail(poi);
});

on('POST', '/api/v1/admin/pois/:id/unpublish', ({ params }) => {
  const poi = requirePoi(params.id);
  poi.status = 'DRAFT';
  touch(poi);
  return detail(poi);
});

// ---------- Translations & audio ----------

on('PUT', '/api/v1/admin/pois/:id/translations/:lang', ({ params, body }) => {
  const poi = requirePoi(params.id);
  requireLanguage(params.lang);
  const e = [];
  if (!body.name?.trim()) e.push(['name', 'Tên hiển thị là bắt buộc']);
  if (body.description && body.description.length > 5000) e.push(['description', 'Mô tả tối đa 5000 ký tự']);
  if (!body.narrationText?.trim()) e.push(['narrationText', 'Nội dung thuyết minh là bắt buộc']);
  else if (body.narrationText.length > 20000) e.push(['narrationText', 'Nội dung thuyết minh tối đa 20000 ký tự']);
  if (e.length) throw validation(e);

  let t = poi.translations.find((x) => x.languageCode === params.lang);
  if (!t) {
    t = { languageCode: params.lang, contentVersion: 1 };
    poi.translations.push(t);
  } else if (t.narrationText.trim() !== body.narrationText.trim()) {
    // Narration changed → new content version; old audio no longer applies
    db.audios
      .filter((a) => a.poiId === poi.id && a.languageCode === t.languageCode && a.contentVersion === t.contentVersion)
      .forEach((a) => (a.status = 'STALE'));
    t.contentVersion += 1;
  }
  Object.assign(t, { name: body.name, description: body.description ?? '', narrationText: body.narrationText, updatedAt: now() });
  poi.updatedAt = now();
  return detail(poi).translations.find((x) => x.languageCode === t.languageCode);
});

const AUDIO_EXT = ['mp3', 'm4a', 'wav', 'ogg'];

on('POST', '/api/v1/admin/pois/:id/translations/:lang/audio', ({ params, formData }) => {
  const poi = requirePoi(params.id);
  const t = requireTranslation(poi, params.lang);
  const file = formData?.get('file');
  if (!file) throw fail(400, 'BAD_REQUEST', 'Thiếu file audio');
  const ext = file.name.split('.').pop().toLowerCase();
  if (!AUDIO_EXT.includes(ext)) throw fail(415, 'UNSUPPORTED_MEDIA', 'Chỉ hỗ trợ MP3, M4A, WAV, OGG');
  if (file.size > 20 * 1024 * 1024) throw fail(413, 'PAYLOAD_TOO_LARGE', 'File audio vượt quá 20 MB');
  const audio = newAudio(nextId(), poi.id, t.languageCode, t.contentVersion, 'UPLOAD', ext, file.size);
  db.audios.push(audio);
  saveBlob(audio.id, file);
  poi.updatedAt = now();
  return audioView(audio);
});

on('GET', '/api/v1/admin/audio/:assetId', ({ params }) => {
  const id = Number(params.assetId);
  if (!db.audios.some((a) => a.id === id)) throw fail(404, 'NOT_FOUND', 'Không tìm thấy audio');
  return mediaResponse(audioBlob(id));
});

// ---------- TTS (job finishes on its own after ~4 s, like a background worker) ----------

const QUEUED_MS = 1500;
const DONE_MS = 4000;

function advanceJobs() {
  const t0 = Date.now();
  for (const job of db.jobs) {
    if (job.status !== 'QUEUED' && job.status !== 'RUNNING') continue;
    const elapsed = t0 - new Date(job.createdAt).getTime();
    if (elapsed < QUEUED_MS) continue;
    if (elapsed < DONE_MS) {
      Object.assign(job, { status: 'RUNNING', attempts: 1 });
      continue;
    }
    const poi = db.pois.find((p) => p.id === job.poiId);
    const t = poi?.translations.find((x) => x.languageCode === job.languageCode);
    if (t?.narrationText.includes('#fail')) {
      Object.assign(job, {
        status: 'FAILED',
        attempts: job.maxAttempts,
        errorCode: 'TTS_PROVIDER_ERROR',
        errorMessage: 'Google Cloud TTS trả về lỗi (giả lập)',
        finishedAt: now(),
      });
    } else {
      const audio = newAudio(nextId(), job.poiId, job.languageCode, job.contentVersion, 'TTS', 'wav', TONE_SIZE);
      db.audios.push(audio);
      Object.assign(job, { status: 'SUCCEEDED', attempts: Math.max(job.attempts, 1), audioId: audio.id, finishedAt: now() });
    }
  }
}

on('POST', '/api/v1/admin/pois/:id/translations/:lang/tts', ({ params }) => {
  if (!TTS_STATUS.configured) throw fail(503, 'TTS_NOT_CONFIGURED', 'Máy chủ chưa cấu hình Google Cloud TTS');
  const poi = requirePoi(params.id);
  const t = requireTranslation(poi, params.lang);
  if (new TextEncoder().encode(t.narrationText).length > TTS_STATUS.maxInputBytes) {
    throw fail(400, 'TTS_TEXT_TOO_LONG', `Nội dung vượt quá ${TTS_STATUS.maxInputBytes} byte cho một lần tạo TTS`);
  }
  const existing = currentAudio(poi, t);
  const last = latestJob(poi.id, t.languageCode);
  if (existing?.source === 'TTS') return { ...jobView(last), status: 'SUCCEEDED', reusedExisting: true };
  if (last && last.contentVersion === t.contentVersion && (last.status === 'QUEUED' || last.status === 'RUNNING')) {
    return jobView(last);
  }
  const job = {
    id: nextId(),
    poiId: poi.id,
    languageCode: t.languageCode,
    contentVersion: t.contentVersion,
    status: 'QUEUED',
    attempts: 0,
    maxAttempts: 3,
    errorCode: null,
    errorMessage: null,
    audioId: null,
    createdAt: now(),
    finishedAt: null,
  };
  db.jobs.push(job);
  return jobView(job);
});

on('GET', '/api/v1/admin/tts/jobs/:jobId', ({ params }) => {
  const job = db.jobs.find((j) => j.id === Number(params.jobId));
  if (!job) throw fail(404, 'NOT_FOUND', 'Không tìm thấy tác vụ TTS');
  return jobView(job);
});

// ---------- Images ----------

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

on('POST', '/api/v1/admin/pois/:id/image', ({ params, formData }) => {
  const poi = requirePoi(params.id);
  if (poi.images.length >= 6) throw fail(409, 'CONFLICT', 'Mỗi POI chỉ được có tối đa 6 ảnh');
  const file = formData?.get('file');
  if (!file) throw fail(400, 'BAD_REQUEST', 'Thiếu file ảnh');
  if (!IMAGE_TYPES.includes(file.type)) throw fail(415, 'UNSUPPORTED_MEDIA', 'Chỉ hỗ trợ ảnh JPEG, PNG, WEBP');
  if (file.size > 5 * 1024 * 1024) throw fail(413, 'PAYLOAD_TOO_LARGE', 'Ảnh vượt quá 5 MB');
  const image = { id: nextId(), mimeType: file.type, sortOrder: poi.images.length };
  poi.images.push(image);
  saveBlob(image.id, file);
  touch(poi);
  return detail(poi);
});

on('GET', '/api/v1/admin/pois/:id/image', ({ params }) => {
  const poi = requirePoi(params.id);
  const cover = [...poi.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  if (!cover) throw fail(404, 'NOT_FOUND', 'POI chưa có ảnh');
  return mediaResponse(imageBlob(cover.id, poi.code));
});

on('GET', '/api/v1/admin/pois/:id/images/:imageId', ({ params }) => {
  const poi = requirePoi(params.id);
  const id = Number(params.imageId);
  if (!poi.images.some((i) => i.id === id)) throw fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh');
  return mediaResponse(imageBlob(id, poi.code));
});

on('DELETE', '/api/v1/admin/pois/:id/images/:imageId', ({ params }) => {
  const poi = requirePoi(params.id);
  const id = Number(params.imageId);
  if (!poi.images.some((i) => i.id === id)) throw fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh');
  poi.images = poi.images
    .filter((i) => i.id !== id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i, index) => ({ ...i, sortOrder: index }));
  touch(poi);
  return detail(poi);
});

on('PUT', '/api/v1/admin/pois/:id/images/order', ({ params, body }) => {
  const poi = requirePoi(params.id);
  const ids = Array.isArray(body) ? body.map(Number) : [];
  const same = ids.length === poi.images.length && poi.images.every((i) => ids.includes(i.id));
  if (!same) throw fail(400, 'BAD_REQUEST', 'Danh sách ảnh không khớp với ảnh hiện có của POI');
  poi.images.forEach((i) => (i.sortOrder = ids.indexOf(i.id)));
  touch(poi);
  return detail(poi);
});
