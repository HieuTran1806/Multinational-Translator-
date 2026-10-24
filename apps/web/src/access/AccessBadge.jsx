import { useEffect, useState } from 'react';
import { useAccess } from './AccessContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { formatRemaining } from './formatRemaining.js';

/**
 * Counts down to `expiresAt`. Mounted once per grant (see the key below), so the clock it starts from
 * is the activation time — not when the header first appeared on the scan screen.
 */
function Remaining({ expiresAt }) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const label = t('access.remaining', { time: formatRemaining(new Date(expiresAt).getTime() - now, t) });
  return (
    <span className="hidden whitespace-nowrap rounded-full bg-paper/15 px-2.5 py-1 text-xs font-medium text-paper min-[380px]:inline-flex" title={label}>
      {label}
    </span>
  );
}

/** Remaining access time in the header, e.g. "Còn 23 giờ 40 phút" (refreshes every 30 s). */
export default function AccessBadge() {
  const { status, grant } = useAccess();
  if (status !== 'active') return null;
  return <Remaining key={grant.expiresAt} expiresAt={grant.expiresAt} />;
}
