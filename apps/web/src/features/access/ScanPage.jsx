import { Suspense, lazy, useCallback, useId, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAccess } from '../../access/AccessContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { Alert, Button, Spinner } from '../../components/ui.jsx';
import { extractQrToken } from './qrToken.js';

// The decoder (jsQR) is only downloaded when the visitor actually opens the camera.
const QrScanner = lazy(() => import('./QrScanner.jsx'));

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" strokeLinecap="round" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </svg>
  );
}

/**
 * UC02 step 1 — entry screen for visitors without access: how it works, live QR scanning with the
 * camera, and manual entry of the code/link (always available when the camera cannot be used).
 * The language can be chosen here already (UC01) since this is the first screen a visitor sees.
 */
export default function ScanPage() {
  const { t } = useLanguage();
  const { status, reason } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const inputId = useId();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState(null);

  const goActivate = useCallback(
    (token) => navigate('/activate', { state: { token, from: location.state?.from } }),
    [navigate, location.state],
  );

  const onScanned = useCallback(
    (text) => {
      setScanning(false);
      const token = extractQrToken(text);
      if (token) goActivate(token);
      else setCameraError('scan.notQr');
    },
    [goActivate],
  );

  const onCameraError = useCallback((key) => {
    setScanning(false);
    setCameraError(key);
  }, []);

  // A1: a still-valid grant on this device continues the session instead of asking for a new QR.
  if (status === 'active') return <Navigate to="/" replace />;

  const submitManual = (e) => {
    e.preventDefault();
    const token = extractQrToken(manual);
    if (!token) {
      setManualError('scan.notQr');
      return;
    }
    goActivate(token);
  };

  return (
    <div className="mx-auto h-full max-w-md overflow-y-auto px-4 pb-10 pt-6">
      {reason && (
        <div className="mb-4">
          <Alert kind="warning">{t(reason === 'expired' ? 'access.expired' : 'access.revoked')}</Alert>
        </div>
      )}

      <h1 className="text-2xl font-bold text-forest">{t('scan.title')}</h1>
      <p className="mt-1 text-sm text-stone">{t('scan.subtitle')}</p>

      <ol className="mt-5 space-y-2.5">
        {['scan.step1', 'scan.step2', 'scan.step3'].map((key, i) => (
          <li key={key} className="flex gap-3 text-sm text-charcoal">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive text-xs font-bold text-paper">
              {i + 1}
            </span>
            <span className="pt-0.5">{t(key)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-3">
        {scanning ? (
          <>
            <Suspense
              fallback={
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-charcoal text-paper">
                  <Spinner />
                </div>
              }
            >
              <QrScanner onResult={onScanned} onError={onCameraError} />
            </Suspense>
            <Button variant="secondary" className="w-full" onClick={() => setScanning(false)}>
              {t('scan.stopCamera')}
            </Button>
          </>
        ) : (
          <Button
            className="h-12 w-full text-base"
            onClick={() => {
              setCameraError(null);
              setScanning(true);
            }}
          >
            <CameraIcon />
            {t('scan.useCamera')}
          </Button>
        )}
        {cameraError && <Alert kind="warning">{t(cameraError)}</Alert>}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-shell-border" />
        {t('scan.orManual')}
        <span className="h-px flex-1 bg-shell-border" />
      </div>

      <form onSubmit={submitManual} className="space-y-2" noValidate>
        <label htmlFor={inputId} className="block text-sm font-semibold text-charcoal">
          {t('scan.manualLabel')}
        </label>
        <input
          id={inputId}
          value={manual}
          onChange={(e) => {
            setManual(e.target.value);
            setManualError(null);
          }}
          placeholder={t('scan.manualPlaceholder')}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(manualError)}
          className="w-full rounded-lg border border-stone/40 bg-white px-3 py-2.5 text-base focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30"
        />
        {manualError && <p className="text-sm text-danger">{t(manualError)}</p>}
        <Button type="submit" variant="secondary" className="h-11 w-full" disabled={!manual.trim()}>
          {t('scan.submit')}
        </Button>
      </form>

      <p className="mt-6 rounded-lg bg-sand/60 p-3 text-xs text-earth">{t('scan.tip')}</p>
    </div>
  );
}
