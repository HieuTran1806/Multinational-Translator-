import { request } from './client.js';

/**
 * Public visitor API (docs/architecture/api.md). No authentication: only PUBLISHED POIs are visible.
 * The list endpoint has no server-side search and caps size at 100, so the UI walks its pages once
 * (see features/explore/usePublicPois.js) and filters client-side (features/explore/search.js).
 */
export const publicApi = {
  languages: ({ signal } = {}) => request('/api/v1/public/languages', { signal }),

  pois: ({ page = 0, size = 100, lang = 'vi', signal } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size), lang });
    return request(`/api/v1/public/pois?${params}`, { signal });
  },

  poi: (id, lang = 'vi', { signal } = {}) =>
    request(
      `/api/v1/public/pois/${encodeURIComponent(id)}?lang=${encodeURIComponent(lang)}`,
      { signal },
    ),
};
