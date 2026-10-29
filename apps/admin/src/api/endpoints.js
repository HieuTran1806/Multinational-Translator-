import { request } from './client.js';

export const authApi = {
  login: (username, password) => request('/api/v1/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
  me: () => request('/api/v1/auth/me'),
};

export const poiApi = {
  list: ({ page = 0, size = 20, status, q } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    return request(`/api/v1/admin/pois?${params}`);
  },
  get: (id) => request(`/api/v1/admin/pois/${id}`),
  remove: (id) => request(`/api/v1/admin/pois/${id}`, { method: 'DELETE' }),
  create: (data) => request('/api/v1/admin/pois', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/v1/admin/pois/${id}`, { method: 'PUT', body: data }),
  publish: (id) => request(`/api/v1/admin/pois/${id}/publish`, { method: 'POST' }),
  unpublish: (id) => request(`/api/v1/admin/pois/${id}/unpublish`, { method: 'POST' }),
  saveTranslation: (id, lang, data) =>
    request(`/api/v1/admin/pois/${id}/translations/${lang}`, { method: 'PUT', body: data }),
  uploadAudio: (id, lang, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/api/v1/admin/pois/${id}/translations/${lang}/audio`, { method: 'POST', formData: fd });
  },
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/api/v1/admin/pois/${id}/image`, { method: 'POST', formData: fd });
  },
  deleteImage: (id, imageId) => request(`/api/v1/admin/pois/${id}/images/${imageId}`, { method: 'DELETE' }),
  reorderImages: (id, imageIds) => request(`/api/v1/admin/pois/${id}/images/order`, { method: 'PUT', body: imageIds }),
};

export const ttsApi = {
  status: () => request('/api/v1/admin/tts/status'),
  generate: (id, lang) => request(`/api/v1/admin/pois/${id}/translations/${lang}/tts`, { method: 'POST' }),
  job: (jobId) => request(`/api/v1/admin/tts/jobs/${jobId}`),
};

/** UC02/UC12 access QR codes issued and managed by Admin. */
export const accessQrApi = {
  list: ({ page = 0, size = 20, status } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return request(`/api/v1/admin/access-qrs?${params}`);
  },
  issue: ({ note, packageCode } = {}) =>
    request('/api/v1/admin/access-qrs', { method: 'POST', body: { note, packageCode } }),
  revoke: (id) => request(`/api/v1/admin/access-qrs/${id}/revoke`, { method: 'POST' }),
};

export const languageApi = {
  list: () => request('/api/v1/admin/languages'),
};

/** Downloads a protected media file (audio/image) as an object URL, since <audio>/<img> cannot send headers. */
export async function fetchMediaObjectUrl(path, signal) {
  const res = await request(path, { raw: true, signal });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** UC10 Admin account management (SUPER_ADMIN only). */
export const adminAccountsApi = {
  list: ({ page = 0, size = 20, q } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    return request(`/api/v1/admin/accounts?${params}`);
  },
  get: (id) => request(`/api/v1/admin/accounts/${id}`),
  create: (data) => request('/api/v1/admin/accounts', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/v1/admin/accounts/${id}`, { method: 'PUT', body: data }),
  resetPassword: (id, newPassword) =>
    request(`/api/v1/admin/accounts/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
  remove: (id) => request(`/api/v1/admin/accounts/${id}`, { method: 'DELETE' }),
};

/** UC14 system analytics (ADMIN only). */
export const analyticsApi = {
  summary: ({ from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/api/v1/admin/analytics/summary?${params}`);
  },
};

/** UC15 audit log (SUPER_ADMIN only). */
export const auditApi = {
  list: ({ page = 0, size = 20, action, result, resourceType, actorId, from, to } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (action) params.set('action', action);
    if (result) params.set('result', result);
    if (resourceType) params.set('resourceType', resourceType);
    if (actorId) params.set('actorId', actorId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/api/v1/admin/audit?${params}`);
  },
};
