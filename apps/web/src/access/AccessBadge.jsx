import { useEffect, useState } from 'react';
import { useAccess } from './AccessContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { formatRemaining } from './formatRemaining.js';

/** Remaining access time in the header, e.g. "Còn 23 giờ 40 phút" (refreshes every 30 s). */
export default function AccessBadge() {
  const { status, grant } = useAccess();
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'active') return undefined;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [status]);

  if (status !== 'active') return null;
  const label = t('access.remaining', { time: formatRemaining(new Date(grant.expiresAt).getTime() - now, t) });
  return (
    <span className="hidden whitespace-nowrap rounded-full bg-paper/15 px-2.5 py-1 text-xs font-medium text-paper min-[380px]:inline-flex" title={label}>
      {label}
    </span>
  );
}
