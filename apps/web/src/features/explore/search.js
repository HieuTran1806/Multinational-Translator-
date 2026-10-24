const DIACRITICS = /[\u0300-\u036f]/g;

/** Lowercases and strips Vietnamese diacritics so "ben duoc" matches "Bến Dược". */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Client-side POI search over the fetched list (the public list endpoint has no query parameter).
 * Every whitespace-separated term must match the name, code or category (as a substring) or be
 * exactly one of the POI's language codes (so "en" does not match "Bến").
 */
export function filterPois(pois, query) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return pois;
  return pois.filter((p) => {
    const haystack = [p.name, p.code, p.category].map(normalizeText).join(' ');
    const languageCodes = (p.languages ?? []).map((l) => normalizeText(l));
    return terms.every((term) => haystack.includes(term) || languageCodes.includes(term));
  });
}
