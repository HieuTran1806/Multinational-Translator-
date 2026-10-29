import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.js';
import { adminAccountsApi } from '../api/endpoints.js';
import AdminAccountsPage from './AdminAccountsPage.jsx';

const ME = vi.hoisted(() => ({ account: { id: 1, username: 'super_root', displayName: 'Super Root', role: 'SUPER_ADMIN' } }));

vi.mock('../api/endpoints.js', () => ({
  adminAccountsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), resetPassword: vi.fn(), remove: vi.fn() },
}));

vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ME,
}));

const page = (items = []) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const ACCOUNT = (over = {}) => ({
  id: 2,
  username: 'admin_02',
  displayName: 'Quản trị Hai',
  role: 'ADMIN',
  enabled: true,
  createdAt: '2026-10-27T08:00:00Z',
  ...over,
});

function renderPage(entry = '/accounts') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AdminAccountsPage />
    </MemoryRouter>,
  );
}

describe('AdminAccountsPage (UC10 – Super Admin quản lý tài khoản Admin)', () => {
  beforeEach(() => {
    adminAccountsApi.list.mockReset().mockResolvedValue(page());
    adminAccountsApi.get.mockReset().mockResolvedValue(ACCOUNT());
    adminAccountsApi.create.mockReset();
    adminAccountsApi.update.mockReset().mockResolvedValue(ACCOUNT());
    adminAccountsApi.resetPassword.mockReset().mockResolvedValue(undefined);
    adminAccountsApi.remove.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists Admin accounts with status badges', async () => {
    adminAccountsApi.list.mockResolvedValue(
      page([
        ACCOUNT(),
        ACCOUNT({ id: 3, username: 'super_02', displayName: 'Super Hai', enabled: false }),
      ]),
    );
    renderPage();
    const table = (await screen.findByText('admin_02')).closest('table');
    expect(within(table).getByText('Quản trị Hai')).toBeInTheDocument();
    expect(within(table).getByText('Super Hai')).toBeInTheDocument();
    expect(within(table).getByText('Đang hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Đã vô hiệu hóa')).toBeInTheDocument();
    expect(within(table).getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('shows the empty state', async () => {
    renderPage();
    expect(await screen.findByText('Chưa có tài khoản quản trị nào. Tạo tài khoản đầu tiên ở trên.')).toBeInTheDocument();
  });

  it('shows an API error with retry', async () => {
    adminAccountsApi.list.mockRejectedValue(Object.assign(new Error('Máy chủ gặp lỗi'), { code: 'HTTP_500' }));
    renderPage();
    expect(await screen.findByText('Máy chủ gặp lỗi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('creates an Admin account and reloads', async () => {
    adminAccountsApi.create.mockResolvedValue(ACCOUNT());
    renderPage();
    await userEvent.type(await screen.findByLabelText('Tên đăng nhập'), 'admin_09');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret-123');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    await waitFor(() =>
      expect(adminAccountsApi.create).toHaveBeenCalledWith({
        username: 'admin_09',
        password: 'secret-123',
        displayName: null,
      }),
    );
    await waitFor(() => expect(adminAccountsApi.list).toHaveBeenCalledTimes(2));
  });

  it('does not submit twice while the create request is in flight', async () => {
    let resolve;
    adminAccountsApi.create.mockImplementation(() => new Promise((r) => (resolve = r)));
    renderPage();
    await userEvent.type(await screen.findByLabelText('Tên đăng nhập'), 'admin_10');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret-123');
    const button = screen.getByRole('button', { name: /Tạo tài khoản|Đang tải/ });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(adminAccountsApi.create).toHaveBeenCalledTimes(1);
    resolve(ACCOUNT());
    await waitFor(() => expect(adminAccountsApi.list).toHaveBeenCalledTimes(2));
  });

  it('shows inline field errors returned by the backend', async () => {
    adminAccountsApi.create.mockRejectedValue(
      new ApiError({
        code: 'CONFLICT',
        message: 'Tên đăng nhập đã tồn tại',
        status: 409,
        fieldErrors: [{ field: 'username', message: 'Tên đăng nhập đã tồn tại' }],
      }),
    );
    renderPage();
    await userEvent.type(await screen.findByLabelText('Tên đăng nhập'), 'admin_02');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret-123');
    await userEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByText('Tên đăng nhập đã tồn tại')).toBeInTheDocument();
  });

  it('disables an account after confirmation and reloads', async () => {
    adminAccountsApi.list.mockResolvedValue(page([ACCOUNT()]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Vô hiệu hóa' }));
    await waitFor(() => expect(adminAccountsApi.update).toHaveBeenCalledWith(2, { enabled: false }));
    expect(await screen.findByText('Đã vô hiệu hóa "admin_02".')).toBeInTheDocument();
  });

  it('does not disable when the confirmation is cancelled', async () => {
    adminAccountsApi.list.mockResolvedValue(page([ACCOUNT()]));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Vô hiệu hóa' }));
    expect(adminAccountsApi.update).not.toHaveBeenCalled();
  });



  it('resets a password', async () => {
    adminAccountsApi.list.mockResolvedValue(page([ACCOUNT()]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Đặt lại mật khẩu' }));
    await userEvent.type(await screen.findByLabelText('Mật khẩu mới cho admin_02'), 'new-pass-9');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(adminAccountsApi.resetPassword).toHaveBeenCalledWith(2, 'new-pass-9'));
    expect(await screen.findByText('Đã đặt lại mật khẩu cho "admin_02".')).toBeInTheDocument();
  });


  it('sends the search filter to the API', async () => {
    renderPage();
    await userEvent.type(await screen.findByLabelText('Tìm tài khoản quản trị'), 'adm');
    await userEvent.click(screen.getByRole('button', { name: 'Tìm' }));
    await waitFor(() => expect(adminAccountsApi.list).toHaveBeenCalledWith({ page: 0, size: 20, q: 'adm' }));
  });
});
