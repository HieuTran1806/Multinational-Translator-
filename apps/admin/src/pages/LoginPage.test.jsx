import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('requires both fields before calling the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng điền đầy đủ');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a clear message on wrong credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS', message: 'Sai tên đăng nhập hoặc mật khẩu' }), {
        status: 401,
      }),
    );
    renderLogin();
    await userEvent.type(screen.getByLabelText('Tên đăng nhập'), 'admin');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Thông tin đăng nhập không chính xác');
    expect(sessionStorage.getItem('tm_admin_session')).toBeNull();
  });
});
