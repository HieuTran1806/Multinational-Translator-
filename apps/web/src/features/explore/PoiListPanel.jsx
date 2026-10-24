import ProtectedImage from '../../components/ProtectedImage.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';
import { languageLabel } from '../../i18n/languages.js';
import { Alert, Badge, Button, Skeleton } from '../../components/ui.jsx';

/**
 * UC03 side panel: search box + the POI list. The list mirrors the current map markers (both are
 * driven by the same filtered result set). API failures surface here with a retry action (E2).
 */
export default function PoiListPanel({ pois, results, query, onQuery, loading, error, onRetry, onOpen, languages }) {
  const t = useT();
  return (
    <section aria-label={t('list.region')} className="flex min-h-0 w-full flex-col border-stone/20 bg-shell md:w-96 md:border-r">
      <div className="shrink-0 space-y-2 border-b border-shell-border bg-white/80 p-3">
        <label htmlFor="poi-search" className="sr-only">
          {t('list.searchLabel')}
        </label>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="poi-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t('list.searchPlaceholder')}
            className="w-full rounded-lg border border-stone/40 bg-white py-2 pl-9 pr-3 text-sm focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-stone" role="status">
          {loading ? t('list.loading') : t('list.count', { shown: results.length, total: pois.length })}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {error ? (
          <Alert
            kind="error"
            title={t('list.loadFailed')}
            action={
              <Button variant="secondary" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            }
          >
            {error.message}
          </Alert>
        ) : loading ? (
          <ul className="space-y-2" aria-busy="true" aria-label={t('list.loadingAria')}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-white p-3">
                <Skeleton className="h-14 w-14 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone/40 bg-white/60 p-6 text-center text-sm text-stone">
            {pois.length === 0
              ? t('list.emptyAll')
              : t('list.emptySearch')}
          </div>
        ) : (
          <ul className="space-y-2" aria-label={t('list.results')}>
            {results.map((poi) => (
              <li key={poi.id}>
                <button
                  type="button"
                  onClick={() => onOpen(poi)}
                  className="flex w-full gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-stone/10 transition hover:ring-olive/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/60"
                >
                  {poi.imageUrl ? (
                    <ProtectedImage
                      path={poi.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sand text-forest"
                    >
                      <svg viewBox="0 0 32 40" className="h-7 w-6" fill="currentColor">
                        <path d="M16 1C8.8 1 3 6.8 3 14c0 9.5 13 25 13 25s13-15.5 13-25C29 6.8 23.2 1 16 1z" />
                      </svg>
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-forest">{poi.name}</span>
                    <span className="mt-0.5 block text-xs text-stone">{poi.category || t('poi.defaultCategory')}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {(poi.languages ?? []).slice(0, 4).map((code) => (
                        <Badge key={code} className="bg-olive/10 text-forest">
                          {languageLabel(languages, code)}
                        </Badge>
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
