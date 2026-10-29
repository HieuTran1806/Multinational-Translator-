import { describe, expect, it, vi } from 'vitest';

vi.mock('../api/client.js', () => ({ request: vi.fn() }));
import { request } from '../api/client.js';
import { publicApi, usageApi } from '../api/endpoints.js';

const requestMock = vi.mocked(request);

describe('publicApi endpoints', () => {
  it('lists languages on the public route', () => {
    requestMock.mockResolvedValue([]);
    publicApi.languages();
    expect(requestMock).toHaveBeenCalledWith('/api/v1/public/languages', {});
  });

  it('builds the POI list URL with page, size and language', () => {
    requestMock.mockResolvedValue({ items: [] });
    publicApi.pois({ page: 1, size: 50, lang: 'en', signal: 's1' });
    expect(requestMock).toHaveBeenCalledWith('/api/v1/public/pois?page=1&size=50&lang=en', { signal: 's1' });
  });

  it('defaults the list to the first max-size page in Vietnamese', () => {
    requestMock.mockResolvedValue({ items: [] });
    publicApi.pois();
    expect(requestMock).toHaveBeenCalledWith('/api/v1/public/pois?page=0&size=100&lang=vi', { signal: undefined });
  });

  it('encodes ids and languages in the detail URL', () => {
    requestMock.mockResolvedValue({});
    publicApi.poi(7, 'en', { signal: 's2' });
    expect(requestMock).toHaveBeenCalledWith('/api/v1/public/pois/7?lang=en', { signal: 's2' });
  });

  it('usageApi.record calls /api/v1/public/usage-events with body', () => {
    requestMock.mockResolvedValue(null);
    usageApi.record('poi_view', { poiId: 10, eventId: 'evt-123' });
    expect(requestMock).toHaveBeenCalledWith('/api/v1/public/usage-events', {
      method: 'POST',
      body: { eventType: 'poi_view', poiId: 10, eventId: 'evt-123' },
      signal: undefined,
    });
  });
});
