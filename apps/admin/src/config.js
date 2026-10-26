/** Backend base URL (public; embedded at build time). No trailing slash. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/** Dev only: serve every API call from the in-browser mock (src/api/mock) instead of the backend. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
