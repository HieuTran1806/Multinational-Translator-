import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sellersApi } from '../api/endpoints.js';
import SellersPage from './SellersPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  sellersApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), resetPassword: vi.fn(), remove: vi.fn() },
}));

const page = (items = []) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const SELLER = (over = {}) => ({
  id: 3,
  username: 'seller_01',
  displayName: 'Seller Một',
  enabled: true,
  createdAt: '2026-10-27T08:00:00Z',
  deletedAt: null,
  ...over,
});

function renderPage(entry = '/sellers') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <SellersPage />
    </MemoryRouter>,
  );
}

describe('SellersPage (UC09 – Admin quản lý tài khoản Seller)', () => {
  beforeEach(() => {
    sellersApi.list.mockReset().mockResolvedValue(page());
    sellersApi.create.mockReset();
    sellersApi.update.mockReset().mockResolvedValue(SELLER());
    sellersApi.resetPassword.mockReset().mockResolvedValue(undefined);
    sellersApi.remove.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists sellers with status badges', async () => {
    sellersApi.list.mockResolvedValue(page([SELLER(), SELLER({ id: 4, username: 'seller_02', enabled: false })]));
    renderPage();
    const table = (await screen.findByText('seller_01')).closest('table');
    expect(within(table).getByText('Đang hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Đã vô hiệu hóa')).toBeInTheDocument();
    expect(within(table).getAllByText('Seller Một').length).toBeGreaterThan(0);
  });

  it('shows the empty state', async () => {
    renderPage();
    expect(await screen.findByText('Chưa có Seller nào. Tạo Seller đầu tiên ở trên.')).toBeInTheDocument();
  });

  it('creates a seller and reloads', async () => {
    sellersApi.create.mockResolvedValue(SELLER());
    renderPage();
    await userEvent.type(await screen.findByLabelText('Tên đăng nhập'), 'seller_09');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret-123');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo Seller' }));
    await waitFor(() => expect(sellersApi.create).toHaveBeenCalledWith(
      { username: 'seller_09', password: 'secret-123', displayName: '' },
    ));
  });

  it('toggles a seller and deletes with confirmation', async () => {
    sellersApi.list.mockResolvedValue(page([SELLER()]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Vô hiệu hóa' }));
    await waitFor(() => expect(sellersApi.update).toHaveBeenCalledWith(3, { enabled: false }));

    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(sellersApi.remove).toHaveBeenCalledWith(3));
  });

  it('resets a password', async () => {
    sellersApi.list.mockResolvedValue(page([SELLER()]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Đặt lại mật khẩu' }));
    await userEvent.type(await screen.findByLabelText('Mật khẩu mới cho seller_01'), 'new-pass-9');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(sellersApi.resetPassword).toHaveBeenCalledWith(3, 'new-pass-9'));
  });

  it('shows an API error with retry', async () => {
    sellersApi.list.mockRejectedValue(Object.assign(new Error('Máy chủ gặp lỗi'), { code: 'HTTP_500' }));
    renderPage();
    expect(await screen.findByText('Máy chủ gặp lỗi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
