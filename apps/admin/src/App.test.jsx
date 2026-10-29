import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const state = vi.hoisted(() => ({ role: 'ADMIN', authenticated: true }));

vi.mock('./auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    isAuthenticated: state.authenticated,
    account: { role: state.role, displayName: 'Người dùng kiểm thử' },
    logout: () => {},
  }),
}));

vi.mock('./api/endpoints.js', () => ({
  poiApi: { list: vi.fn().mockResolvedValue({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 }) },
  languageApi: { list: vi.fn().mockResolvedValue([]) },
  ttsApi: { status: vi.fn().mockResolvedValue({ configured: false }) },
  adminAccountsApi: {
    list: vi.fn().mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 }),
  },
  fetchMediaObjectUrl: vi.fn(),
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('route guards', () => {
  beforeEach(() => {
    state.role = 'ADMIN';
    state.authenticated = true;
  });

  it('sends unauthenticated visitors to the login page', () => {
    state.authenticated = false;
    renderAt('/pois');
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('ADMIN reaches the POI list', async () => {
    renderAt('/pois');
    expect(await screen.findByRole('heading', { name: 'Quản lý POI' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quản lý POI' })).toBeInTheDocument();
  });

  it('ADMIN cannot open the UC10 account management page', async () => {
    renderAt('/accounts');
    expect(await screen.findByText('Không đủ quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tài khoản Admin' })).not.toBeInTheDocument();
  });

  it('SUPER_ADMIN reaches UC10 and sees the navigation entry', async () => {
    state.role = 'SUPER_ADMIN';
    renderAt('/accounts');
    expect(await screen.findByRole('heading', { name: 'Tài khoản Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tài khoản Admin' })).toBeInTheDocument();
  });

  it('SUPER_ADMIN gets a permission message and no POI navigation', async () => {
    state.role = 'SUPER_ADMIN';
    renderAt('/pois/1');
    expect(await screen.findByText('Không đủ quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quản lý POI' })).not.toBeInTheDocument();
  });

  it('ADMIN cannot open the seller reports page', async () => {
    renderAt('/reports');
    expect(await screen.findByText('Không đủ quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Báo cáo của tôi' })).not.toBeInTheDocument();
  });

  it('SUPER_ADMIN lands on UC10 after login instead of the ADMIN-only POI list', async () => {
    state.role = 'SUPER_ADMIN';
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Tài khoản Admin' })).toBeInTheDocument();
  });
});
