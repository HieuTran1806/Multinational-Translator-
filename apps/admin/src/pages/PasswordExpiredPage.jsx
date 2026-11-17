import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from '../components/ui.jsx';

/**
 * UI-only lock screen. No self-service password-change API exists yet,
 * so we must not pretend that typing a new password updates the server.
 */
export default function PasswordExpiredPage() {
  const { logout } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand p-4">
      <section className="w-full max-w-md space-y-4 rounded-3xl bg-paper p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-earth">Củ Chi Guide · Quản trị</p>
        <h1 className="text-2xl font-bold text-forest">Đã quá hạn đổi mật khẩu</h1>
        <p className="text-sm text-charcoal">
          Đã hết thời hạn 24 giờ. Giao diện quản trị tạm thời bị khóa đối với tài khoản này.
          Vui lòng liên hệ Super Admin để được hỗ trợ đổi mật khẩu.
        </p>
        <p className="text-xs text-stone">
          Đây chỉ là giới hạn tại giao diện. Hệ thống hiện chưa hỗ trợ Admin tự đổi mật khẩu.
        </p>
        <Button type="button" className="w-full" onClick={logout}>Đăng xuất</Button>
      </section>
    </main>
  );
}
