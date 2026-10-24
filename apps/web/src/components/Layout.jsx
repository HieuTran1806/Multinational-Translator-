import { Outlet, useLocation } from 'react-router';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AccessBadge from '../access/AccessBadge.jsx';
import { useT } from '../i18n/LanguageContext.jsx';

/** Visitor shell: brand, remaining access time (UC02) and language switcher (UC01) on every page. */
export default function Layout() {
  const { key } = useLocation();
  const t = useT();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 bg-forest px-3 text-paper sm:px-4">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden="true">
            <path fill="#a65f3b" d="M16 2C10.4 2 6 6.4 6 12c0 7 10 18 10 18s10-11 10-18c0-5.6-4.4-10-10-10z" />
            <circle cx="16" cy="12" r="5" fill="#fff9ee" />
            <path fill="none" stroke="#a65f3b" strokeWidth="1.6" strokeLinecap="round" d="M14.4 10.2v3.6M16.9 10.9l-2.5 1.6" />
          </svg>
          <span className="truncate text-base font-bold tracking-tight">
            {t('app.brand')} <span className="hidden font-medium text-paper/70 sm:inline">{t('app.brandSuffix')}</span>
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-2">
          <AccessBadge />
          <LanguageSwitcher />
        </div>
      </header>
      <main key={key} className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
