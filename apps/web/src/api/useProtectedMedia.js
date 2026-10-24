import { useCallback, useEffect, useState } from 'react';
import { fetchMediaObjectUrl } from './client.js';

/**
 * Loads grant-protected media (UC02 locks /public/audio and /public/pois/…/image) into an object URL,
 * since <img>/<audio> cannot send the Authorization/X-Device-Id headers. The URL is revoked when the
 * path changes or the component unmounts. `retry` re-downloads after a failure.
 */
export function useProtectedMedia(path) {
  const [attempt, setAttempt] = useState(0);
  const key = path ? `${path}|${attempt}` : null;
  const [result, setResult] = useState({ key: null, url: null, error: null });

  useEffect(() => {
    if (!key) return undefined;
    const ctrl = new AbortController();
    let created = null;
    fetchMediaObjectUrl(path, { signal: ctrl.signal })
      .then((url) => {
        if (url.startsWith('blob:')) created = url;
        setResult({ key, url, error: null });
      })
      .catch((error) => error?.name !== 'AbortError' && setResult({ key, url: null, error }));
    return () => {
      ctrl.abort();
      if (created) URL.revokeObjectURL?.(created);
    };
  }, [key, path]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const current = key !== null && result.key === key;
  return {
    url: current ? result.url : null,
    error: current ? result.error : null,
    loading: key !== null && !current,
    retry,
  };
}
