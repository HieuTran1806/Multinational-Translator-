import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useProtectedMedia } from '../../api/useProtectedMedia.js';
import { publicApi } from '../../api/endpoints.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { languageLabel } from '../../i18n/languages.js';
import { intlLocale } from '../../i18n/messages.js';
import { Alert, Badge, Button, Skeleton, Spinner } from '../../components/ui.jsx';
import ImageGallery from './ImageGallery.jsx';
import NarrationPlayer from '../audio/NarrationPlayer.jsx';
import { useOnlineStatus } from '../explore/useOnlineStatus.js';

function formatDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(intlLocale(lang), { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * UC04 – POI detail in the current narration language: content, images, available languages and the
 * UC05 narration player. Missing translation falls back with a notice (A1); missing audio still
 * shows the transcript (A2); hidden/unknown POI returns to the map (E1); failures offer retry (E2)
 * and connectivity is surfaced (E3). Images and audio are downloaded with the UC02 grant.
 */
export default function PoiDetailPage() {
  const { id } = useParams();
  const { lang, setLang, languages, t } = useLanguage();
  const online = useOnlineStatus();
  const [nonce, setNonce] = useState(0);
  const key = `${id}|${lang}|${nonce}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .poi(id, lang)
      .then((data) => {
        if (cancelled) return;
        setResult({ key, data, error: null });
        setShowTranscript(false);
      })
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, id, lang]);

  const loading = result.key !== key;
  const error = loading ? null : result.error;
  const detail = loading || error ? null : result.data;
  const audio = useProtectedMedia(detail?.audio?.url ?? null);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-56 w-full sm:h-72" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    const notFound = error.status === 404;
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <Alert kind="error" title={notFound ? t('detail.notFound') : t('detail.loadFailed')}>
          {error.message}
        </Alert>
        <div className="flex gap-2">
          {!notFound && (
            <Button onClick={() => setNonce((n) => n + 1)}>{t('common.retry')}</Button>
          )}
          <Link
            to="/"
            className="inline-flex items-center rounded-lg border border-stone/40 bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sand/50"
          >
            {t('detail.backToMap')}
          </Link>
        </div>
      </div>
    );
  }

  const images = detail.imageUrl ? [detail.imageUrl, ...(detail.images ?? []).filter((u) => u !== detail.imageUrl)] : (detail.images ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-10">
      {!online && (
        <Alert kind="warning" title={t('detail.offlineTitle')}>
          {t('detail.offlineBody')}
        </Alert>
      )}

      <div>
        <Link to="/" className="text-sm font-semibold text-olive hover:underline">
          {t('detail.backLink')}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-forest">{detail.name}</h1>
          <Badge className="bg-olive/15 text-forest">{detail.category || t('poi.defaultCategory')}</Badge>
        </div>
        <p className="mt-1 text-xs text-stone">
          {t('detail.meta', { code: detail.code, date: formatDate(detail.updatedAt, lang) })}
        </p>
      </div>

      {detail.fallback && (
        <Alert kind="info" title={t('detail.fallbackTitle')}>
          {t('detail.fallbackBody', {
            requested: languageLabel(languages, detail.requestedLanguage),
            shown: languageLabel(languages, detail.language),
          })}
        </Alert>
      )}

      <ImageGallery images={images} alt={detail.name} />

      <section aria-label={t('detail.info')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">{t('detail.lat')}</p>
          <p className="text-sm font-semibold text-charcoal">{detail.latitude.toFixed(5)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">{t('detail.lng')}</p>
          <p className="text-sm font-semibold text-charcoal">{detail.longitude.toFixed(5)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">{t('detail.radius')}</p>
          <p className="text-sm font-semibold text-charcoal">{Math.round(detail.triggerRadius)} m</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">{t('detail.langCount')}</p>
          <p className="text-sm font-semibold text-charcoal">{detail.availableLanguages.length}</p>
        </div>
      </section>

      <section aria-label={t('detail.narration')} className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">{t('detail.narration')}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-stone">{t('detail.languages')}</span>
          {(detail.availableLanguages ?? []).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={code === detail.language}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                code === detail.language
                  ? 'bg-olive text-paper'
                  : 'bg-white text-charcoal ring-1 ring-stone/30 hover:ring-olive/50'
              }`}
            >
              {languageLabel(languages, code)}
            </button>
          ))}
        </div>

        {!detail.audio ? (
          <Alert kind="info" title={t('detail.noAudioTitle')}>
            {t('detail.noAudioBody', { lang: languageLabel(languages, detail.language) })}
          </Alert>
        ) : audio.error ? (
          <Alert
            kind="error"
            title={t('player.errorTitle')}
            action={
              <Button variant="secondary" onClick={audio.retry}>
                {t('common.retry')}
              </Button>
            }
          >
            {audio.error.message}
          </Alert>
        ) : audio.url ? (
          <NarrationPlayer audioUrl={audio.url} />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-stone/25 bg-white p-4 text-sm text-stone">
            <Spinner small />
            {t('detail.audioLoading')}
          </div>
        )}

        <div className="rounded-xl border border-stone/25 bg-white p-4">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            className="text-sm font-semibold text-olive hover:underline"
          >
            {showTranscript ? t('detail.hideTranscript') : t('detail.showTranscript')}
          </button>
          {showTranscript && (
            <article className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal">
              {detail.narrationText}
            </article>
          )}
        </div>
      </section>

      {detail.description && (
        <section aria-label={t('detail.about')} className="rounded-xl bg-white p-4 ring-1 ring-stone/10">
          <h2 className="mb-2 text-lg font-semibold text-forest">{t('detail.about')}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal">{detail.description}</p>
        </section>
      )}
    </div>
  );
}
