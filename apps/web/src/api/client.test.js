import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl, mediaUrl, ApiError, request, setAccessLostHandler } from './client.js';
import { getDeviceId, saveGrant } from '../access/grantStore.js';

vi.mock('../config.js', () => ({ API_BASE_URL: 'http://api.test' }));

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('client helpers', () => {
  it('joins the API base with a relative path', () => {
    expect(apiUrl('/api/v1/public/pois')).toBe('http://api.test/api/v1/public/pois');
  });

  it('mediaUrl passes API-relative paths through and maps null to null', () => {
    expect(mediaUrl('/api/v1/public/audio/7')).toBe('http://api.test/api/v1/public/audio/7');
    expect(mediaUrl(null)).toBeNull();
  });

  it('ApiError keeps the backend error shape', () => {
    const e = new ApiError({ code: 'NOT_FOUND', message: 'Địa điểm', status: 404 });
    expect(e.code).toBe('NOT_FOUND');
    expect(e.status).toBe(404);
    expect(e.message).toBe('Địa điểm');
    expect(e.name).toBe('ApiError');
  });
});

describe('request with the UC02 grant', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessLostHandler(() => {});
  });

  it('sends no credentials before activation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);
    await request('/api/v1/public/languages');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].headers['X-Device-Id']).toBeUndefined();
  });

  it('adds the grant token and this device id to every call after activation', async () => {
    saveGrant({ accessToken: 'grant-abc', expiresAt: '2999-01-01T00:00:00Z', packageCode: 'DEMO_24H' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await request('/api/v1/public/pois');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer grant-abc');
    expect(headers['X-Device-Id']).toBe(getDeviceId());
    expect(getDeviceId()).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
  });

  it('posts JSON bodies (redeem) and reports 401 ACCESS_REQUIRED to the access handler', async () => {
    const lost = vi.fn();
    setAccessLostHandler(lost);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { code: 'ACCESS_REQUIRED', message: 'QR' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('/api/v1/public/access/redeem', { method: 'POST', body: { qrToken: 'X' } }))
      .rejects.toMatchObject({ code: 'ACCESS_REQUIRED', status: 401 });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"qrToken":"X"}' });
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it('turns a network failure into NETWORK_ERROR (E5: no access is granted)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('/api/v1/public/access/me')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });
});
