/**
 * Backend base URL (public; embedded at build time). No trailing slash.
 * Empty by default: the dev server proxies /api to the backend (same origin), and in production the
 * app is expected to be served behind the same domain as the API. Set VITE_API_BASE_URL when the API
 * lives on another origin (the backend must then allow this origin via APP_CORS_ALLOWED_ORIGINS).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
