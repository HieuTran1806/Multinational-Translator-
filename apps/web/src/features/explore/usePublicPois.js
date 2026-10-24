import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../../api/endpoints.js';

/**
 * Loads the published POI list localized in `lang`; `reload` re-fetches (E2 retry).
 * "Loading" is derived by comparing the result's key with the current request key, so the effect
 * never sets state synchronously (same pattern as apps/admin).
 */
export function usePublicPois(lang) {
  const [nonce, setNonce] = useState(0);
  const key = `${lang}|${nonce}`;
  const [result, setResult] = useState({ key: null, pois: [], total: 0, error: null });

  useEffect(() => {
    let cancelled = false;
    // The backend caps page size at 100; walk the pages (bounded) so client-side search sees all POIs.
    publicApi
      .pois({ lang })
      .then(async (first) => {
        let items = first.items ?? [];
        const totalPages = Math.min(first.totalPages ?? 1, 10);
        for (let p = 1; p < totalPages; p++) {
          const next = await publicApi.pois({ lang, page: p });
          if (cancelled) return;
          items = items.concat(next.items ?? []);
        }
        return { items, totalItems: first.totalItems ?? items.length };
      })
      .then((page) =>
        !cancelled &&
        setResult({ key, pois: page.items, total: page.totalItems, error: null }),
      )
      .catch((error) => !cancelled && setResult({ key, pois: [], total: 0, error }));
    return () => {
      cancelled = true;
    };
  }, [key, lang]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const loading = result.key !== key;
  return {
    pois: loading ? [] : result.pois,
    total: loading ? 0 : result.total,
    loading,
    error: loading ? null : result.error,
    reload,
  };
}
