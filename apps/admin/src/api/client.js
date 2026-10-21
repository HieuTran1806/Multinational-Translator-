import { API_BASE_URL } from '../config.js';
import { loadSession } from '../auth/session.js';

/** Error with the backend's uniform shape: { code, message, status, fieldErrors }. */
export class ApiError extends Error {
  constructor({ code, message, status, fieldErrors }) {
    super(message || 'Đã xảy ra lỗi');
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN';
    this.status = status || 0;
    this.fieldErrors = fieldErrors || [];
  }

  /** Map of field -> message, for inline form errors. */
  fieldMap() {
    return Object.fromEntries(this.fieldErrors.map((f) => [f.field, f.message]));
  }
}

// The token is read from the stored session on every request, so requests fired by a child effect during the
// first render already carry it (a provider effect would run too late).
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function parseError(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (body && typeof body === 'object' && body.code) {
    return new ApiError({ ...body, status: response.status });
  }
  return new ApiError({
    code: `HTTP_${response.status}`,
    message: response.status >= 500 ? 'Máy chủ gặp lỗi, vui lòng thử lại sau' : `Yêu cầu thất bại (${response.status})`,
    status: response.status,
  });
}

/**
 * fetch wrapper: adds the bearer token, parses JSON, converts errors to ApiError,
 * and signals 401 so the UI can return to the login screen.
 */
export async function request(path, { method = 'GET', body, formData, signal, raw = false } = {}) {
  // Same check as USE_MOCK in config.js, inlined so Vite can drop the mock chunk from production builds
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { mockRequest } = await import('./mock/handlers.js');
    return mockRequest(path, { method, body, formData, signal, raw });
  }
  const headers = { Accept: raw ? '*/*' : 'application/json' };
  const token = loadSession()?.accessToken ?? null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(apiUrl(path), { method, headers, body: payload, signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.',
      status: 0,
    });
  }
  if (!response.ok) {
    const err = await parseError(response);
    if (response.status === 401 && token) onUnauthorized();
    throw err;
  }
  if (raw) return response;
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
