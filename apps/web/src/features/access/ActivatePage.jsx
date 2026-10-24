import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAccess } from '../../access/AccessContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { intlLocale } from '../../i18n/messages.js';
import { Alert, Button, Spinner } from '../../components/ui.jsx';

function errorKey(error) {
  switch (error?.code) {
    case 'ACCESS_QR_INVALID':
    case 'VALIDATION_FAILED':
      return 'activate.err.invalid';
    case 'ACCESS_QR_ALREADY_USED':
      return 'activate.err.used';
    case 'NETWORK_ERROR':
      return 'activate.err.network';
    default:
      return 'activate.err.generic';
  }
}

/** Only failures that may succeed on a second try get a retry button (E5); used/invalid codes do not. */
const RETRYABLE = new Set(['activate.err.network', 'activate.err.generic']);

/**
 * UC02 steps 3–5 — redeems the QR token and confirms the result. Reached either from the scan screen
 * (token in router state) or by opening the link encoded in the QR with the phone camera (A2:
 * `/activate?t=<token>`); the token is then removed from the address bar/history right away.
 */
export default function ActivatePage() {
  const { t, lang } = useLanguage();
  const { activate } = useAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => location.state?.token ?? new URLSearchParams(location.search).get('t'));
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ attempt: -1, grant: null, error: null });

  // Strip `?t=` so the single-use token does not linger in history or get shared by copying the URL.
  useEffect(() => {
    if (location.search) navigate('/activate', { replace: true, state: { token } });
  }, [location.search, navigate, token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    activate(token)
      .then((grant) => !cancelled && setResult({ attempt, grant, error: null }))
      .catch((error) => !cancelled && setResult({ attempt, grant: null, error }));
    return () => {
      cancelled = true;
    };
  }, [token, attempt, activate]);

  if (!token) {
    return (
      <Centered>
        <Alert kind="error" title={t('activate.failedTitle')}>
          {t('activate.missingToken')}
        </Alert>
        <ScanAgain t={t} />
      </Centered>
    );
  }

  if (result.attempt !== attempt) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-3 py-10 text-forest">
          <Spinner />
          <p className="text-sm font-medium">{t('activate.verifying')}</p>
        </div>
      </Centered>
    );
  }

  if (result.error) {
    const key = errorKey(result.error);
    return (
      <Centered>
        <Alert kind="error" title={t('activate.failedTitle')}>
          {t(key)}
        </Alert>
        <div className="flex flex-col gap-2">
          {RETRYABLE.has(key) && <Button onClick={() => setAttempt((a) => a + 1)}>{t('common.retry')}</Button>}
          <ScanAgain t={t} />
        </div>
      </Centered>
    );
  }

  const until = new Date(result.grant.expiresAt).toLocaleString(intlLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return (
    <Centered>
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-olive/15 text-olive">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-forest">{t('activate.successTitle')}</h1>
        <p className="text-sm text-charcoal">{t('activate.successBody', { time: until })}</p>
      </div>
      <Button className="h-12 w-full text-base" onClick={() => navigate(location.state?.from ?? '/', { replace: true })}>
        {t('activate.start')}
      </Button>
    </Centered>
  );
}

function Centered({ children }) {
  return <div className="mx-auto flex h-full max-w-md flex-col gap-4 overflow-y-auto px-4 py-8">{children}</div>;
}

function ScanAgain({ t }) {
  return (
    <Link
      to="/welcome"
      replace
      className="inline-flex h-11 items-center justify-center rounded-lg border border-stone/40 bg-white px-4 text-sm font-semibold text-charcoal hover:bg-sand/50"
    >
      {t('activate.scanAgain')}
    </Link>
  );
}
