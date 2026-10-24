import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import PoiMap from './PoiMap.jsx';
import PoiListPanel from './PoiListPanel.jsx';
import { filterPois } from './search.js';
import { useOnlineStatus } from './useOnlineStatus.js';
import { usePublicPois } from './usePublicPois.js';

/**
 * UC03 entry screen: interactive map with POI markers next to the searchable place list. Marker and
 * list selection both open the POI detail page (UC04).
 */
export default function ExplorePage() {
  const { lang, languages, t } = useLanguage();
  const navigate = useNavigate();
  const { pois, loading, error, reload } = usePublicPois(lang);
  const [query, setQuery] = useState('');
  const online = useOnlineStatus();

  const results = useMemo(() => filterPois(pois, query), [pois, query]);

  const openDetail = useCallback((poi) => navigate(`/pois/${poi.id}`), [navigate]);

  return (
    <div className="relative flex h-full min-h-0 flex-col md:flex-row">
      <div className="order-2 flex min-h-[45vh] flex-1 md:order-none md:min-h-0">
        <PoiMap pois={results} onOpen={openDetail} />
      </div>
      <PoiListPanel
        pois={pois}
        results={results}
        query={query}
        onQuery={setQuery}
        loading={loading}
        error={error}
        onRetry={reload}
        onOpen={openDetail}
        languages={languages}
      />
      {!online && (
        <div
          role="alert"
          className="absolute inset-x-0 top-0 z-[1100] bg-danger px-4 py-2 text-center text-sm font-medium text-white"
        >
          {t('offline.banner')}
        </div>
      )}
    </div>
  );
}
