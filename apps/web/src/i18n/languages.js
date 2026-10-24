/** Default narration language (matches PoiPublicService.DEFAULT_LANGUAGE on the backend). */
export const DEFAULT_LANGUAGE = 'vi';

/** Display name for a language code: native name when known, else the raw code. */
export function languageLabel(languages, code) {
  if (code === DEFAULT_LANGUAGE) return 'Tiếng Việt';
  const l = languages.find((x) => x.code === code);
  return l ? l.nativeName || l.name : code.toUpperCase();
}
