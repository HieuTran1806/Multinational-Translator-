import { API_BASE_URL } from '../config.js';

/** Error with the backend's uniform shape: { code, message, status, fieldErrors }. */
export class ApiError extends Error {
  constructor({ code, message, status, fieldErrors }) {
    super(message || 'Đã xảy ra lỗi');
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN';
    this.status = status || 0;
    this.fieldErrors = fieldErrors || [];
  }
}

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/**
 * Media paths returned by the API (image/audio URLs) are relative to the API base. Turn them into
 * URLs usable by <img>/<audio>; returns null for null input so callers can render placeholders.
 */
export function mediaUrl(path) {
  return path ? apiUrl(path) : null;
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

/** fetch wrapper for public endpoints: parses JSON and converts errors to ApiError. */
export async function request(path, { signal } = {}) {
  // Same check as USE_MOCK in config.js, inlined so Vite can drop the mock chunk from production builds
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { mockRequest } = await import('./mock/handlers.js');
    return mockRequest(path, { signal });
  }
  let response;
  try {
    response = await fetch(apiUrl(path), { method: 'GET', headers: { Accept: 'application/json' }, signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      status: 0,
    });
  }
  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
