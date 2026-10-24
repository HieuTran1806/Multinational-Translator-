import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/endpoints.js';
import { DEFAULT_LANGUAGE } from './languages.js';

const STORAGE_KEY = 'tm.lang';

/**
 * The narration language chosen in UC01 drives every public call in UC03–UC05: the POI list is
 * re-fetched with localized names and the detail endpoint returns content + audio for this locale
 * (with a documented fallback when the translation is missing).
 */
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);
  // Loading starts true (no synchronous state change is needed when the effect first runs).
  const [state, setState] = useState({ languages: [], loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .languages()
      .then((list) => !cancelled && setState({ languages: list, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ languages: [], loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      languages: state.languages,
      loading: state.loading,
      error: state.error,
      reload: () => setNonce((n) => n + 1),
    }),
    [lang, setLang, state],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
