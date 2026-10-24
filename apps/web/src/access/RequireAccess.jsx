import { Navigate, Outlet, useLocation } from 'react-router';
import { useAccess } from './AccessContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { Alert, Button, Spinner } from '../components/ui.jsx';

/**
 * Route guard for every User feature (UC03–UC06): without a verified grant the visitor goes to the scan
 * screen. The backend enforces the same rule; this only avoids showing pages that would fail.
 */
export default function RequireAccess() {
  const { status, reason, retryVerify } = useAccess();
  const { t } = useLanguage();
  const location = useLocation();

  if (status === 'active') return <Outlet />;

  if (status === 'checking') {
    return (
      <div className="flex h-full items-center justify-center p-6 text-forest">
        <Spinner label={t('access.checking')} />
      </div>
    );
  }

  if (status === 'unverified') {
    return (
      <div className="mx-auto max-w-md space-y-3 p-6">
        <Alert kind="warning" title={t('access.verifyFailed.title')}>
          {t('access.verifyFailed.body')}
        </Alert>
        <Button onClick={retryVerify}>{t('common.retry')}</Button>
      </div>
    );
  }

  return <Navigate to="/welcome" replace state={{ from: location.pathname, reason }} />;
}
