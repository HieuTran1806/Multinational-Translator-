import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { LanguageProvider } from '../../i18n/LanguageContext.jsx';
import { AccessProvider } from '../../access/AccessContext.jsx';
import Layout from '../../components/Layout.jsx';
import ScanPage from './ScanPage.jsx';
import ActivatePage from './ActivatePage.jsx';
import { loadGrant, resetGrantStoreForTests, saveGrant } from '../../access/grantStore.js';

vi.mock('../../api/endpoints.js', () => ({
  publicApi: {
    languages: vi.fn().mockResolvedValue([
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]),
  },
  accessApi: { me: vi.fn(), redeem: vi.fn() },
}));
import { accessApi } from '../../api/endpoints.js';

const redeemMock = vi.mocked(accessApi.redeem);
const GRANT = () => ({
  accessToken: 'grant-token',
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  packageCode: 'DEMO_24H',
});

function Where() {
  const location = useLocation();
  return <div data-testid="where">{location.pathname + location.search}</div>;
}

function renderAt(entry) {
  return render(
    <StrictMode>
      <LanguageProvider>
        <AccessProvider>
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/welcome" element={<ScanPage />} />
                <Route path="/activate" element={<><ActivatePage /><Where /></>} />
                <Route path="/" element={<div data-testid="explore">explore</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AccessProvider>
      </LanguageProvider>
    </StrictMode>,
  );
}

describe('Scan screen (UC02 step 1)', () => {
  it('explains the steps and offers camera scanning and manual entry', () => {
    renderAt('/welcome');
    expect(screen.getByRole('heading', { name: 'Chào mừng bạn!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quét mã QR bằng camera/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Mã QR hoặc đường link kích hoạt')).toBeInTheDocument();
  });

  it('rejects manual input that contains no activation code', async () => {
    const user = userEvent.setup();
    renderAt('/welcome');
    await user.type(screen.getByLabelText('Mã QR hoặc đường link kích hoạt'), 'hi');
    await user.click(screen.getByRole('button', { name: 'Kích hoạt' }));
    expect(screen.getByText('Không đọc được mã kích hoạt từ nội dung này.')).toBeInTheDocument();
    expect(redeemMock).not.toHaveBeenCalled();
  });

  it('falls back to manual entry when the camera is unavailable', async () => {
    const user = userEvent.setup();
    renderAt('/welcome');
    await user.click(screen.getByRole('button', { name: /Quét mã QR bằng camera/ }));
    expect(await screen.findByText(/Không tìm thấy camera/)).toBeInTheDocument();
    expect(screen.getByLabelText('Mã QR hoặc đường link kích hoạt')).toBeInTheDocument();
  });

  it('UC01: switching the language also switches the interface', async () => {
    const user = userEvent.setup();
    renderAt('/welcome');
    await user.selectOptions(await screen.findByLabelText('Ngôn ngữ'), 'en');
    expect(screen.getByRole('heading', { name: 'Welcome!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan QR code with camera/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('Activation (UC02 steps 3–5)', () => {
  it('redeems a manually entered code once and confirms the access period', async () => {
    const user = userEvent.setup();
    redeemMock.mockResolvedValue(GRANT());
    renderAt('/welcome');
    await user.type(screen.getByLabelText('Mã QR hoặc đường link kích hoạt'), 'DEMO-QR-0002');
    await user.click(screen.getByRole('button', { name: 'Kích hoạt' }));

    expect(await screen.findByRole('heading', { name: 'Kích hoạt thành công!' })).toBeInTheDocument();
    expect(redeemMock).toHaveBeenCalledTimes(1); // StrictMode double effect must not redeem twice
    expect(redeemMock).toHaveBeenCalledWith('DEMO-QR-0002', expect.stringMatching(/^[A-Za-z0-9_-]{16,}$/));
    expect(loadGrant()).toMatchObject({ accessToken: 'grant-token' });
    expect(await screen.findByText(/Còn 23 giờ|Còn 24 giờ/)).toBeInTheDocument(); // header badge

    await user.click(screen.getByRole('button', { name: 'Bắt đầu khám phá' }));
    expect(await screen.findByTestId('explore')).toBeInTheDocument();
  });

  it('A2: opening the QR link activates and removes the token from the address bar', async () => {
    redeemMock.mockResolvedValue(GRANT());
    renderAt('/activate?t=LINK-TOKEN-1');
    expect(await screen.findByRole('heading', { name: 'Kích hoạt thành công!' })).toBeInTheDocument();
    expect(redeemMock).toHaveBeenCalledTimes(1);
    expect(redeemMock.mock.calls[0][0]).toBe('LINK-TOKEN-1');
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/activate$/);
  });

  it('E2: an already used QR is refused without a retry button', async () => {
    redeemMock.mockRejectedValue({ code: 'ACCESS_QR_ALREADY_USED', status: 409 });
    renderAt('/activate?t=USED-TOKEN');
    expect(await screen.findByText(/đã được sử dụng/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Quét mã khác' })).toBeInTheDocument();
    expect(loadGrant()).toBeNull();
  });

  it('E1/E3: an invalid or revoked QR shows a generic message', async () => {
    redeemMock.mockRejectedValue({ code: 'ACCESS_QR_INVALID', status: 400 });
    renderAt('/activate?t=BAD-TOKEN');
    expect(await screen.findByText(/không hợp lệ hoặc đã bị thu hồi/)).toBeInTheDocument();
  });

  it('E5: a network failure grants nothing and can be retried', async () => {
    const user = userEvent.setup();
    redeemMock.mockRejectedValueOnce({ code: 'NETWORK_ERROR', status: 0 });
    redeemMock.mockResolvedValueOnce(GRANT());
    renderAt('/activate?t=NET-TOKEN');
    expect(await screen.findByText(/Không kết nối được máy chủ/)).toBeInTheDocument();
    expect(loadGrant()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Kích hoạt thành công!' })).toBeInTheDocument();
    expect(redeemMock).toHaveBeenCalledTimes(2);
  });

  it('A1: a visitor who still has access on this device skips the scan screen', async () => {
    const grant = GRANT();
    saveGrant(grant);
    resetGrantStoreForTests(); // reopened app
    vi.mocked(accessApi.me).mockResolvedValue({ grantId: 1, packageCode: 'DEMO_24H', expiresAt: grant.expiresAt });
    renderAt('/welcome');
    expect(await screen.findByTestId('explore')).toBeInTheDocument();
    expect(redeemMock).not.toHaveBeenCalled();
  });
});
