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
};

export const ttsApi = {
  status: () => request('/api/v1/admin/tts/status'),
  generate: (id, lang) => request(`/api/v1/admin/pois/${id}/translations/${lang}/tts`, { method: 'POST' }),
  job: (jobId) => request(`/api/v1/admin/tts/jobs/${jobId}`),
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
