/** Backend base URL (public; embedded at build time). No trailing slash. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

export const LANGUAGE_LABELS = {
  vi: 'Tiếng Việt',
  en: 'English',
};
