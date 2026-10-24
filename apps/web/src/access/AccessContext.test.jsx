import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccessProvider, useAccess } from './AccessContext.jsx';
import { loadGrant, resetGrantStoreForTests, saveGrant } from './grantStore.js';

vi.mock('../api/endpoints.js', () => ({ accessApi: { me: vi.fn(), redeem: vi.fn() } }));
import { accessApi } from '../api/endpoints.js';

const meMock = vi.mocked(accessApi.me);
const redeemMock = vi.mocked(accessApi.redeem);
const inMs = (ms) => new Date(Date.now() + ms).toISOString();

function storeGrant(expiresAt) {
  saveGrant({ accessToken: 'stored', expiresAt, packageCode: 'DEMO_24H' });
  resetGrantStoreForTests(); // simulate reopening the app: read back from localStorage
}

// Latest context value, captured after each render so tests can call activate()/retryVerify().
const handle = { current: null };
function Probe() {
  const access = useAccess();
  useEffect(() => {
    handle.current = access;
  });
  return (
    <div>
      <span data-testid="status">{access.status}</span>
      <span data-testid="reason">{access.reason ?? 'none'}</span>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AccessProvider>
      <Probe />
    </AccessProvider>,
  );

describe('AccessProvider (UC02)', () => {
  it('starts without access when nothing was activated on this device', () => {
    renderProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('none');
    expect(meMock).not.toHaveBeenCalled();
  });

  it('A1: restores a still-valid grant after the backend confirms it', async () => {
    const expiresAt = inMs(3600_000);
    storeGrant(expiresAt);
    meMock.mockResolvedValue({ grantId: 1, packageCode: 'DEMO_24H', expiresAt, remainingSeconds: 3600 });
    renderProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('checking');
    expect(await screen.findByText('active')).toBeInTheDocument();
  });

  it('ends the session when the backend rejects the stored grant (revoked / other device)', async () => {
    storeGrant(inMs(3600_000));
    meMock.mockRejectedValue({ status: 401, code: 'ACCESS_REQUIRED' });
    renderProvider();
    expect(await screen.findByText('revoked')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('none');
    expect(loadGrant()).toBeNull();
  });

  it('E5: does not grant access while the backend is unreachable, and retries on demand', async () => {
    const expiresAt = inMs(3600_000);
    storeGrant(expiresAt);
    meMock.mockRejectedValueOnce({ status: 0, code: 'NETWORK_ERROR' });
    renderProvider();
    expect(await screen.findByText('unverified')).toBeInTheDocument();

    meMock.mockResolvedValue({ grantId: 1, packageCode: 'DEMO_24H', expiresAt, remainingSeconds: 3600 });
    act(() => handle.current.retryVerify());
    expect(await screen.findByText('active')).toBeInTheDocument();
  });

  it('drops a grant that already expired locally without calling the backend', () => {
    storeGrant(inMs(-1000));
    renderProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('none');
    expect(screen.getByTestId('reason')).toHaveTextContent('expired');
    expect(meMock).not.toHaveBeenCalled();
  });

  it('ends an active session exactly when the grant expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      redeemMock.mockResolvedValue({ accessToken: 'g', expiresAt: inMs(5_000), packageCode: 'DEMO_24H' });
      renderProvider();
      await act(() => handle.current.activate('QR-1'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');
      await act(() => vi.advanceTimersByTimeAsync(6_000));
      expect(screen.getByTestId('status')).toHaveTextContent('none');
      expect(screen.getByTestId('reason')).toHaveTextContent('expired');
    } finally {
      vi.useRealTimers();
    }
  });

  it('redeems a QR only once even if activation is requested twice (StrictMode / double tap)', async () => {
    redeemMock.mockResolvedValue({ accessToken: 'g', expiresAt: inMs(3600_000), packageCode: 'DEMO_24H' });
    renderProvider();
    await act(() => Promise.all([handle.current.activate('QR-2'), handle.current.activate('QR-2')]));
    expect(redeemMock).toHaveBeenCalledTimes(1);
    expect(redeemMock.mock.calls[0][1]).toMatch(/^[A-Za-z0-9_-]{16,128}$/); // the device id
    expect(loadGrant()).toMatchObject({ accessToken: 'g' });
  });

  it('a revoked grant reports "revoked" even when several requests fail at once', async () => {
    const client = await import('../api/client.js');
    redeemMock.mockResolvedValue({ accessToken: 'g', expiresAt: inMs(3600_000), packageCode: 'DEMO_24H' });
    renderProvider();
    await act(() => handle.current.activate('QR-4'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ code: 'ACCESS_REQUIRED', message: 'x' }), { status: 401 })));
    try {
      await act(() => Promise.allSettled([client.request('/a'), client.request('/b'), client.request('/c')]));
    } finally {
      vi.unstubAllGlobals();
    }
    expect(screen.getByTestId('status')).toHaveTextContent('none');
    expect(screen.getByTestId('reason')).toHaveTextContent('revoked');
  });

  it('allows a retry after a failed redeem', async () => {
    const user = userEvent.setup();
    redeemMock.mockRejectedValueOnce({ code: 'NETWORK_ERROR' });
    redeemMock.mockResolvedValueOnce({ accessToken: 'g', expiresAt: inMs(3600_000), packageCode: 'DEMO_24H' });
    render(
      <AccessProvider>
        <Probe />
        <button type="button" onClick={() => handle.current.activate('QR-3').catch(() => {})}>
          go
        </button>
      </AccessProvider>,
    );
    await user.click(screen.getByText('go'));
    await user.click(screen.getByText('go'));
    expect(await screen.findByText('active')).toBeInTheDocument();
    expect(redeemMock).toHaveBeenCalledTimes(2);
  });
});
