import { Outlet, useLocation } from 'react-router';
import LanguageSwitcher from './LanguageSwitcher.jsx';

/** Visitor shell: brand + language switcher (UC01) on top of every UC03–UC05 page. */
export default function Layout() {
  const { key } = useLocation();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 bg-forest px-4 text-paper">
        <a href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
            <path fill="#a65f3b" d="M16 2C10.4 2 6 6.4 6 12c0 7 10 18 10 18s10-11 10-18c0-5.6-4.4-10-10-10z" />
            <circle cx="16" cy="12" r="5" fill="#fff9ee" />
            <path fill="none" stroke="#a65f3b" strokeWidth="1.6" strokeLinecap="round" d="M14.4 10.2v3.6M16.9 10.9l-2.5 1.6" />
          </svg>
          <span className="text-base font-bold tracking-tight">
            Thuyết minh <span className="hidden font-medium text-paper/70 sm:inline">– điểm tham quan</span>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>
      <main key={key} className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
