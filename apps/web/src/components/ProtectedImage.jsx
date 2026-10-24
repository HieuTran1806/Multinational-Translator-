import { useEffect } from 'react';
import { useProtectedMedia } from '../api/useProtectedMedia.js';

/**
 * <img> for a grant-protected API image path. Shows a neutral placeholder while loading and calls
 * `onError` when the download or the decode fails, so callers can keep their own broken-image UI.
 */
export default function ProtectedImage({ path, alt, className = '', onError, ...props }) {
  const { url, error, loading } = useProtectedMedia(path);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  if (loading || error || !url) {
    return <span aria-hidden="true" className={`block animate-pulse bg-stone/15 ${className}`} />;
  }
  return <img src={url} alt={alt} className={className} onError={() => onError?.(new Error('decode'))} {...props} />;
}
