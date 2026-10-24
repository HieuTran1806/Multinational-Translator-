import { ApiError } from '../client.js';
import { LANGUAGES, MOCK_POIS, audioView } from './fixtures.js';

/**
 * Fake backend for UI work without the real services. Enabled by VITE_USE_MOCK=true (see
 * src/config.js). Read-only and stateless (the visitor app never writes), returning the same JSON
 * shapes and error codes as the real public API (docs/architecture/api.md).
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

export async function mockRequest(path, { signal } = {}) {
  const [pathname, search = ''] = path.split('?');
  await delay(180, signal);
  const query = new URLSearchParams(search);

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
