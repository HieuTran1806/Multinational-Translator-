import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, setUnauthorizedHandler } from './client.js';

const KEY = 'tm_admin_session';

/** Puts a valid session in storage, which is what the request wrapper reads the token from. */
function storeSession(accessToken) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({ accessToken, expiresAt: new Date(Date.now() + 60_000).toISOString(), account: { role: 'ADMIN' } }),
  );
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  sessionStorage.clear();
  setUnauthorizedHandler(() => {});
});

describe('request', () => {
  it('adds bearer token from the stored session and parses JSON', async () => {
    storeSession('tok');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: true }));
    await expect(request('/api/v1/x')).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('sends no Authorization header without a session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: true }));
    await expect(request('/api/v1/x')).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('maps the uniform backend error, including field errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, {
        code: 'VALIDATION_FAILED',
        message: 'Dữ liệu không hợp lệ',
        fieldErrors: [{ field: 'latitude', message: 'Vĩ độ phải trong khoảng -90..90' }],
      }),
    );
    const err = await request('/api/v1/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('VALIDATION_FAILED');
    expect(err.status).toBe(400);
    expect(err.fieldMap()).toEqual({ latitude: 'Vĩ độ phải trong khoảng -90..90' });
  });

  it('signals 401 so the app can drop the session', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    storeSession('expired');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(401, { code: 'UNAUTHENTICATED', message: 'x' }));
    await expect(request('/api/v1/admin/pois')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports network failures with a helpful message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('handles non-JSON 5xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(request('/x')).rejects.toMatchObject({ code: 'HTTP_502', status: 502 });
  });
});
