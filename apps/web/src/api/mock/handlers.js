import { ApiError } from '../client.js';
import { LANGUAGES, MOCK_POIS, audioView } from './fixtures.js';

/**
 * Fake backend for UI work without the real services. Enabled by VITE_USE_MOCK=true (see
 * src/config.js). Stateless apart from the UC02 grant the app itself keeps in localStorage, returning
 * the same JSON shapes and error codes as the real User API (docs/architecture/api.md).
 */

const DEFAULT_LANGUAGE = 'vi';

function pick(translationMap, lang) {
  if (translationMap[lang]) return translationMap[lang];
  if (translationMap[DEFAULT_LANGUAGE]) return translationMap[DEFAULT_LANGUAGE];
  const codes = Object.keys(translationMap).sort();
  return codes.length ? translationMap[codes[0]] : null;
}

function fail(status, code, message) {
  return new ApiError({ code, message, status });
}

function summary(poi, lang) {
  const map = Object.fromEntries(poi.translations.map((t) => [t.languageCode, t]));
  const t = pick(map, lang);
  return {
    id: poi.id,
    code: poi.code,
    name: t ? t.name : poi.code,
    latitude: poi.latitude,
    longitude: poi.longitude,
    imageUrl: poi.cover,
    category: poi.category,
    triggerRadius: poi.triggerRadius,
    languages: poi.translations.map((t2) => t2.languageCode).sort(),
    updatedAt: poi.updatedAt,
  };
}

function detail(poi, requested) {
  const map = Object.fromEntries(poi.translations.map((t) => [t.languageCode, t]));
  const t = pick(map, requested);
  const images = [poi.cover, ...poi.images.filter((i) => i !== poi.cover)];
  return {
    id: poi.id,
    code: poi.code,
    requestedLanguage: requested,
    language: t.languageCode,
    fallback: t.languageCode !== requested,
    availableLanguages: poi.translations.map((t2) => t2.languageCode).sort(),
    name: t.name,
    description: t.description,
    narrationText: t.narrationText,
    contentVersion: 1,
    audio: t.audio ? audioView(t.languageCode) : null,
    imageUrl: poi.cover,
    images,
    category: poi.category,
    triggerRadius: poi.triggerRadius,
    latitude: poi.latitude,
    longitude: poi.longitude,
    updatedAt: poi.updatedAt,
  };
}

/**
 * UC02 in mock mode: any code activates a 24 h grant except these, which reproduce the backend errors.
 * `MOCK-USED` → 409 already used, `MOCK-BAD` → 400 invalid/revoked.
 */
function mockRedeem(body) {
  const token = String(body?.qrToken ?? '').trim();
  if (token === 'MOCK-USED') {
    throw fail(409, 'ACCESS_QR_ALREADY_USED', 'Mã QR này đã được sử dụng. Vui lòng liên hệ người bán để được hỗ trợ.');
  }
  if (!token || token === 'MOCK-BAD') throw fail(400, 'ACCESS_QR_INVALID', 'Mã QR không hợp lệ.');
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return { accessToken: `mock-grant-${token}`, tokenType: 'Bearer', expiresAt, packageCode: 'DEMO_24H' };
}

export async function mockRequest(path, { method = 'GET', body, signal } = {}) {
  const [pathname, search = ''] = path.split('?');
  await delay(180, signal);
  const query = new URLSearchParams(search);

  if (method === 'POST' && pathname === '/api/v1/public/access/redeem') return mockRedeem(body);
  if (pathname === '/api/v1/public/access/me') {
    const grant = JSON.parse(localStorage.getItem('tm.grant') ?? 'null');
    if (!grant) throw fail(401, 'ACCESS_REQUIRED', 'Vui lòng quét mã QR hợp lệ để sử dụng chức năng này');
    const remainingSeconds = Math.max(0, Math.floor((new Date(grant.expiresAt).getTime() - Date.now()) / 1000));
    return { grantId: 1, packageCode: grant.packageCode, expiresAt: grant.expiresAt, remainingSeconds };
  }

  if (pathname === '/api/v1/public/languages') return structuredClone(LANGUAGES);

  if (pathname === '/api/v1/public/pois') {
    const page = Number(query.get('page') ?? 0);
    const size = Number(query.get('size') ?? 50);
    const lang = query.get('lang') ?? DEFAULT_LANGUAGE;
    const items = MOCK_POIS.map((p) => summary(p, lang));
    const start = page * size;
    return { items: items.slice(start, start + size), page, size, totalItems: items.length, totalPages: Math.ceil(items.length / size) };
  }

  const m = pathname.match(/^\/api\/v1\/public\/pois\/(\d+)$/);
  if (m) {
    const poi = MOCK_POIS.find((p) => p.id === Number(m[1]));
    if (!poi) throw fail(404, 'NOT_FOUND', 'Địa điểm không tồn tại hoặc không còn công khai');
    return structuredClone(detail(poi, query.get('lang') ?? DEFAULT_LANGUAGE));
  }

  console.warn(`[mock] chưa có route cho GET ${pathname}`);
  throw fail(404, 'NOT_FOUND', `Mock chưa hỗ trợ GET ${pathname}`);
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) return abort();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => (clearTimeout(t), abort()), { once: true });
  });
}
