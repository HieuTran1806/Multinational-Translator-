import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from './ui.jsx';

/** Sidebar shell following Penpot page "04 — ADMIN". Only implemented features are listed (no fake links). */
export default function Layout() {
  const { account, logout } = useAuth();
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-sidebar text-paper md:w-64">
        <div className="px-6 py-6">
          <p className="text-xl font-bold tracking-tight">CỦ CHI GUIDE</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand/70">Quản trị nội dung</p>
        </div>
        <nav className="flex gap-1 px-3 md:flex-col">
          <NavLink
            to="/pois"
            className={({ isActive }) =>
              `rounded-xl px-4 py-2.5 text-sm font-semibold ${isActive ? 'bg-sidebar-active' : 'hover:bg-white/10'}`
            }
          >
            Địa điểm (POI)
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-white/10 px-6 py-4 text-sm">
          <p className="font-semibold">{account?.displayName || account?.username}</p>
          <p className="text-xs text-sand/70">{account?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
          <Button variant="ghost" className="mt-2 -ml-4 !text-sand hover:!bg-white/10" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto bg-[#f5f1e8] p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
