import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../api/client.js';
import { AuthProvider } from './AuthContext.jsx';

function Child() {
  useEffect(() => {
    request('/api/v1/admin/pois').catch(() => {});
  }, []);
  return null;
}

afterEach(() => vi.unstubAllGlobals());

it('sends the stored bearer token on requests fired by the first child effect', async () => {
  sessionStorage.setItem(
    'tm_admin_session',
    JSON.stringify({
      accessToken: 'tok-123',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      account: { username: 'admin01', role: 'ADMIN' },
    }),
  );
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);

  render(
    <AuthProvider>
      <Child />
    </AuthProvider>,
  );

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const [, init] = fetchMock.mock.calls[0];
  expect(init.headers.Authorization).toBe('Bearer tok-123');
});
