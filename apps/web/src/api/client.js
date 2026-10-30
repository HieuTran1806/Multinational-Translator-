import { API_BASE_URL } from '../config.js';
import { getDeviceId, loadGrant } from '../access/grantStore.js';

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
 * User media needs the grant headers, so pages load it through useProtectedMedia (fetch + object URL).
 */
export function mediaUrl(path) {
  return path ? apiUrl(path) : null;
}

/**
 * UC02: called when the backend answers 401 ACCESS_REQUIRED (grant expired, revoked or bound to another
 * device). AccessProvider registers itself here and sends the visitor back to the scan screen.
 */
let onAccessLost = () => {};

export function setAccessLostHandler(handler) {
  onAccessLost = handler;
}

/** Headers every User request carries once a QR was redeemed (see docs/USE_CASES.md). */
export function accessHeaders() {
  const grant = loadGrant();
  return grant ? { Authorization: `Bearer ${grant.accessToken}`, 'X-Device-Id': getDeviceId() } : {};
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

function networkError() {
  return new ApiError({
    code: 'NETWORK_ERROR',
    message: 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
    status: 0,
  });
}

/** fetch wrapper for User endpoints: adds the grant headers, parses JSON and converts errors to ApiError. */
export async function request(path, { method = 'GET', body, signal, raw = false } = {}) {
  // Same check as USE_MOCK in config.js, inlined so Vite can drop the mock chunk from production builds
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { mockRequest } = await import('./mock/handlers.js');
    return mockRequest(path, { method, body, signal });
  }
  const headers = { Accept: raw ? '*/*' : 'application/json', ...accessHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw networkError();
  }
  if (!response.ok) {
    const error = await parseError(response);
    if (error.code === 'ACCESS_REQUIRED') onAccessLost(error);
    throw error;
  }
  if (raw) return response;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Downloads a grant-protected media file (image/audio) and returns an object URL for <img>/<audio>,
 * which cannot send headers themselves. Absolute URLs (mock fixtures) are returned unchanged.
 * The caller must URL.revokeObjectURL() the result when done.
 */
export async function fetchMediaObjectUrl(path, { signal } = {}) {
  if (/^(https?:|data:|blob:)/.test(path) || import.meta.env.VITE_USE_MOCK === 'true') return path;
  const response = await request(path, { raw: true, signal });
  return URL.createObjectURL(await response.blob());
}
