import { ApiRequestError, createApiClient } from '../src/api/client';

const res = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body } as unknown as Response);

describe('api client', () => {
  it('builds absolute URLs from relative server paths', () => {
    const c = createApiClient(() => 'http://10.0.2.2:8080', jest.fn());
    expect(c.absoluteUrl('/api/v1/public/audio/1')).toBe('http://10.0.2.2:8080/api/v1/public/audio/1');
    expect(c.absoluteUrl('https://cdn.example/a.mp3')).toBe('https://cdn.example/a.mp3');
  });

  it('maps backend errors (draft POI -> 404)', async () => {
    const c = createApiClient(() => 'http://h', async () => res(404, { code: 'NOT_FOUND', message: 'Địa điểm không tồn tại' }));
    const err = (await c.getJson('/x').catch(e => e)) as ApiRequestError;
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.isNotFound).toBe(true);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('maps network failures to status 0', async () => {
    const c = createApiClient(() => 'http://h', async () => {
      throw new TypeError('Network request failed');
    });
    const err = (await c.getJson('/x').catch(e => e)) as ApiRequestError;
    expect(err.isNetwork).toBe(true);
  });
});
