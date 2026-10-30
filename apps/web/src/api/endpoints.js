import { request } from './client.js';

/**
 * User API (docs/USE_CASES.md). Only languages and the QR redeem are open; everything else needs
 * the UC02 grant, which client.js attaches automatically. Only PUBLISHED POIs are visible.
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

/** UC02 — redeem a single-use QR for a time-limited grant bound to this device; check the current grant. */
export const accessApi = {
  redeem: (qrToken, deviceId) =>
    request('/api/v1/public/access/redeem', { method: 'POST', body: { qrToken, deviceId } }),
  me: ({ signal } = {}) => request('/api/v1/public/access/me', { signal }),
};

/** UC13/UC14 — report usage metrics from the User app (poi_view, audio_play, session_start). */
export const usageApi = {
  record: (eventType, { poiId = null, eventId = null, signal } = {}) =>
    request('/api/v1/public/usage-events', {
      method: 'POST',
      body: { eventType, poiId, eventId },
      signal,
    }),
};
