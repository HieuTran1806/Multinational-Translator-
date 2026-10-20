import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Button, Field, inputClass } from '../components/ui.jsx';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/pois" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate(location.state?.from || '/pois', { replace: true });
    } catch (err) {
      setError(
        err.code === 'INVALID_CREDENTIALS'
          ? 'Thông tin đăng nhập không chính xác. Vui lòng thử lại.'
          : err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-sand p-4">
      <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-5 rounded-3xl bg-paper p-8 shadow-lg">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-earth">Củ Chi Guide · Quản trị</p>
          <h1 className="mt-1 text-2xl font-bold text-forest">Đăng nhập</h1>
        </div>
        {error && <Alert>{error}</Alert>}
        <Field label="Tên đăng nhập" htmlFor="username">
          <input
            id="username"
            className={inputClass}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field label="Mật khẩu" htmlFor="password">
          <input
            id="password"
            type="password"
            className={inputClass}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" loading={submitting}>
          {submitting ? 'Đang xác thực…' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}
