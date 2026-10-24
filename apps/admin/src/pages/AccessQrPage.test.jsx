import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessQrApi } from '../api/endpoints.js';
import AccessQrPage from './AccessQrPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  accessQrApi: { list: vi.fn(), issue: vi.fn(), revoke: vi.fn() },
}));

const page = (items = []) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const QR = (over = {}) => ({
  id: 7,
  status: 'ISSUED',
  packageCode: 'DEMO_24H',
  durationMinutes: 1440,
  note: 'Khách đoàn A',
  createdAt: '2026-10-24T08:00:00Z',
  redeemedAt: null,
  revokedAt: null,
  ...over,
});

function renderPage(entry = '/access-qrs') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AccessQrPage />
    </MemoryRouter>,
  );
}

describe('AccessQrPage (UC02 – Admin issues visitor QR codes)', () => {
  beforeEach(() => {
    accessQrApi.list.mockReset().mockResolvedValue(page());
    accessQrApi.issue.mockReset();
    accessQrApi.revoke.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists QR codes with their status', async () => {
    accessQrApi.list.mockResolvedValue(page([QR(), QR({ id: 6, status: 'REDEEMED', note: null, redeemedAt: '2026-10-24T09:00:00Z' })]));
    renderPage();
    const table = (await screen.findByText('#7')).closest('table');
    expect(within(table).getByText('Chưa sử dụng')).toBeInTheDocument();
    expect(within(table).getByText('Đã kích hoạt')).toBeInTheDocument();
    expect(within(table).getByText('Khách đoàn A')).toBeInTheDocument();
  });

  it('issues a QR and shows the image, token and activation link once', async () => {
    const user = userEvent.setup();
    accessQrApi.issue.mockResolvedValue({
      ...QR({ id: 8, note: 'Vé 123' }),
      qrToken: 'TOKEN-ABC',
      activationUrl: 'http://localhost:5174/activate?t=TOKEN-ABC',
    });
    renderPage();
    await screen.findByText(/Chưa có QR nào/);

    await user.type(screen.getByLabelText('Ghi chú (không bắt buộc)'), 'Vé 123');
    await user.click(screen.getByRole('button', { name: 'Tạo QR (gói 24 giờ)' }));

    expect(accessQrApi.issue).toHaveBeenCalledWith({ note: 'Vé 123' });
    expect(await screen.findByText('TOKEN-ABC')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:5174/activate?t=TOKEN-ABC')).toBeInTheDocument();
    const img = await screen.findByAltText('Mã QR kích hoạt');
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    expect(screen.getByText(/chỉ hiển thị/)).toBeInTheDocument();
    await waitFor(() => expect(accessQrApi.list).toHaveBeenCalledTimes(2)); // list refreshed
  });

  it('revokes after confirmation and warns when the QR is in use', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    accessQrApi.list.mockResolvedValue(page([QR({ status: 'REDEEMED' })]));
    accessQrApi.revoke.mockResolvedValue(QR({ status: 'REVOKED' }));
    renderPage();

    const row = (await screen.findByText('#7')).closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Thu hồi' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/mất quyền truy cập ngay/));
    expect(accessQrApi.revoke).toHaveBeenCalledWith(7);
  });

  it('does not revoke when the confirmation is cancelled, and hides the action for revoked QRs', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    accessQrApi.list.mockResolvedValue(page([QR(), QR({ id: 5, status: 'REVOKED', revokedAt: '2026-10-24T10:00:00Z' })]));
    renderPage();

    const issuedRow = (await screen.findByText('#7')).closest('tr');
    await user.click(within(issuedRow).getByRole('button', { name: 'Thu hồi' }));
    expect(accessQrApi.revoke).not.toHaveBeenCalled();
    const revokedRow = screen.getByText('#5').closest('tr');
    expect(within(revokedRow).queryByRole('button', { name: 'Thu hồi' })).toBeNull();
  });

  it('filters by status through the URL', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/Chưa có QR nào/);
    await user.selectOptions(screen.getByLabelText('Lọc trạng thái QR'), 'ISSUED');
    await waitFor(() => expect(accessQrApi.list).toHaveBeenLastCalledWith({ page: 0, size: 20, status: 'ISSUED' }));
  });

  it('shows a retryable error when the list cannot be loaded', async () => {
    const user = userEvent.setup();
    accessQrApi.list.mockRejectedValueOnce(new Error('Máy chủ lỗi'));
    renderPage();
    expect(await screen.findByText('Không thể tải danh sách QR')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText(/Chưa có QR nào/)).toBeInTheDocument();
  });
});
