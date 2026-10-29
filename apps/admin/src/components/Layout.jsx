import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import { USE_MOCK } from '../config.js';
import { Button } from './ui.jsx';

/** Sidebar + topbar shell following the Figma page "MT - Admin Portal" (MT / Admin / Desktop / Dashboard & POI). */

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.5-3.5 2.8-5 5.5-5s5 1.5 5.5 5" strokeLinecap="round" />
      <path d="M16 5.5a3 3 0 0 1 0 5M18.5 20c-.2-2.2-1-3.6-2.3-4.4" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 20V4" strokeLinecap="round" />
      <path d="M4 20h16" strokeLinecap="round" />
      <path d="M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21c4.5-1.8 7-4.8 7-9V6l-7-3-7 3v6c0 4.2 2.5 7.2 7 9Z" strokeLinejoin="round" />
      <path d="m9.5 12 2 2 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" strokeLinecap="round" />
    </svg>
  );
}

const navClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold ${
    isActive ? 'bg-nav-active text-olive' : 'text-charcoal hover:bg-sand/40'
  }`;

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '');
}

const CRUMBS = [
  [/^\/pois$/, 'Quản lý POI'],
  [/^\/pois\/new$/, 'Tạo POI'],
  [/^\/pois\/\d+$/, 'Chi tiết & chỉnh sửa POI'],
  [/^\/access-qrs$/, 'QR truy cập'],
  [/^\/sellers$/, 'Tài khoản Seller'],
  [/^\/analytics$/, 'Analytics'],
  [/^\/accounts$/, 'Tài khoản Admin'],
  [/^\/audit$/, 'Audit Log'],
  [/^\/reports$/, 'Báo cáo của tôi'],
];

export default function Layout() {
  const { account, logout } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = account?.role === 'ADMIN';
  const isSuper = account?.role === 'SUPER_ADMIN';
  const isSeller = account?.role === 'SELLER';
  const crumb = CRUMBS.find(([re]) => re.test(pathname))?.[1];

  return (
    <div className="flex min-h-full flex-col bg-shell md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-shell-border bg-white md:w-[248px] md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-olive text-[13px] font-bold text-white">
            MT
          </span>
          <span>
            <span className="block text-[13px] font-bold text-forest">Multilingual</span>
            <span className="block text-[11px] text-muted">Translator · Admin</span>
          </span>
        </div>
        <div className="mx-4 h-px bg-shell-border" />
        <p className="px-5 pt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Quản trị</p>
        <nav className="flex gap-1 px-3 py-2 md:flex-col">
          {/* Only ADMIN owns POI content (UC07); other roles have no implemented page yet. */}
          {isAdmin && (
            <NavLink to="/pois" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <MapPinIcon />
                  </span>
                  Quản lý POI
                </>
              )}
            </NavLink>
          )}
          {/* UC02: Admin issues visitor QR codes until the Seller flow (UC12) exists. */}
          {isAdmin && (
            <NavLink to="/access-qrs" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <QrIcon />
                  </span>
                  QR truy cập
                </>
              )}
            </NavLink>
          )}
          {/* UC09: seller accounts are an Admin responsibility. */}
          {isAdmin && (
            <NavLink to="/sellers" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <UsersIcon />
                  </span>
                  Tài khoản Seller
                </>
              )}
            </NavLink>
          )}
          {/* UC14: analytics is shared by Admin and Super Admin. */}
          {(isAdmin || isSuper) && (
            <NavLink to="/analytics" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <ChartIcon />
                  </span>
                  Analytics
                </>
              )}
            </NavLink>
          )}
          {/* UC10: only Super Admin manages Admin/Super Admin accounts. */}
          {isSuper && (
            <NavLink to="/accounts" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <UsersIcon />
                  </span>
                  Tài khoản Admin
                </>
              )}
            </NavLink>
          )}
          {/* UC15: only Super Admin reads the audit log. */}
          {isSuper && (
            <NavLink to="/audit" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <ShieldIcon />
                  </span>
                  Audit Log
                </>
              )}
            </NavLink>
          )}
          {/* UC13: the seller sees only its own reports. */}
          {isSeller && (
            <NavLink to="/reports" className={navClass}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" className={isActive ? 'text-olive' : 'text-muted'}>
                    <ChartIcon />
                  </span>
                  Báo cáo của tôi
                </>
              )}
            </NavLink>
          )}
        </nav>
        {USE_MOCK && (
          <p className="mx-4 mt-2 inline-block rounded bg-terracotta px-2 py-0.5 text-[11px] font-bold text-paper">
            DỮ LIỆU GIẢ (MOCK)
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 border-t border-shell-border px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-nav-active text-xs font-bold text-olive">
            {initials(account?.displayName || account?.username)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-forest">
              {account?.displayName || account?.username}
            </span>
            <span className="block text-[11px] text-muted">
              {account?.role === 'SUPER_ADMIN' ? 'Super Admin' : account?.role === 'SELLER' ? 'Seller' : 'Quản trị viên'}
            </span>
          </span>
          <Button variant="ghost" className="!px-2 !py-1 text-[11px]" onClick={logout} title="Đăng xuất">
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-shell-border bg-white px-4 py-3 md:px-6">
          <p className="text-[12px] text-muted">
            Admin
            {crumb && <span className="text-charcoal"> / {crumb}</span>}
          </p>
          {isAdmin && pathname.startsWith('/pois') && pathname !== '/pois/new' && (
            <NavLink
              to="/pois/new"
              className="inline-flex items-center gap-2 rounded-lg bg-olive px-4 py-2 text-[13px] font-semibold text-paper hover:bg-olive-dark"
            >
              + Thêm POI mới
            </NavLink>
          )}
        </header>
        <main className="flex-1 overflow-x-auto bg-shell p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
