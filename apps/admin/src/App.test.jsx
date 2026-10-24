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

  it('SUPER_ADMIN gets a permission message and no POI navigation', async () => {
    state.role = 'SUPER_ADMIN';
    renderAt('/pois/1');
    expect(await screen.findByText('Không đủ quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quản lý POI' })).not.toBeInTheDocument();
  });
});
