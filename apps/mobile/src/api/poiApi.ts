import type { ApiClient } from './client';
import type { Language, OfflineManifest, PageResponse, PoiDetail, PoiSummary } from './types';

export function createPoiApi(client: ApiClient) {
  return {
    listPublished: (lang: string, page = 0, size = 100) =>
      client.getJson<PageResponse<PoiSummary>>(
        `/api/v1/public/pois?page=${page}&size=${size}&lang=${encodeURIComponent(lang)}`,
      ),
    detail: (id: number, lang: string) =>
      client.getJson<PoiDetail>(`/api/v1/public/pois/${id}?lang=${encodeURIComponent(lang)}`),
    manifest: (id: number) => client.getJson<OfflineManifest>(`/api/v1/public/pois/${id}/offline-manifest`),
    languages: () => client.getJson<Language[]>('/api/v1/public/languages'),
    absoluteUrl: client.absoluteUrl,
  };
}

export type PoiApi = ReturnType<typeof createPoiApi>;
