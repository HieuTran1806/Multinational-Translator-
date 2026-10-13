import { describe, expect, it, vi } from 'vitest';
import { ApiError, configureAuth, request } from './client.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('request', () => {
  it('adds bearer token and parses JSON', async () => {
    configureAuth({ getToken: () => 'tok', handleUnauthorized: () => {} });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: true }));
    await expect(request('/api/v1/x')).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('maps the uniform backend error, including field errors', async () => {
    configureAuth({ getToken: () => null, handleUnauthorized: () => {} });
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
    configureAuth({ getToken: () => 'expired', handleUnauthorized: onUnauthorized });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(401, { code: 'UNAUTHENTICATED', message: 'x' }));
    await expect(request('/api/v1/admin/pois')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports network failures with a helpful message', async () => {
    configureAuth({ getToken: () => null, handleUnauthorized: () => {} });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('handles non-JSON 5xx responses', async () => {
    configureAuth({ getToken: () => null, handleUnauthorized: () => {} });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(request('/x')).rejects.toMatchObject({ code: 'HTTP_502', status: 502 });
  });
});
