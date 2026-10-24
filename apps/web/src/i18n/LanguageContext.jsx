import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/endpoints.js';
import { DEFAULT_LANGUAGE } from './languages.js';
import { translate, uiLocale } from './messages.js';

const STORAGE_KEY = 'tm.lang';

function readStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * UC01 — the chosen language drives both the UI strings (`t`, see messages.js) and every public call
 * in UC03–UC05: the POI list is re-fetched with localized names and the detail endpoint returns
 * content + audio for this locale (with a documented fallback when the translation is missing).
 * The list of choices comes from GET /public/languages (data, not a hard-coded enum).
 */
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  // Loading starts true (no synchronous state change is needed when the effect first runs).
  const [state, setState] = useState({ languages: [], loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  const setLang = useCallback((code) => {
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage blocked (private mode): the choice still applies for this session */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .languages()
      .then((list) => {
        if (cancelled) return;
        setState({ languages: list, loading: false, error: null });
        // A language that was disabled since the last visit falls back to the default.
        if (list.length && !list.some((l) => l.code === readStoredLang())) setLang(DEFAULT_LANGUAGE);
      })
      .catch((error) => !cancelled && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      cancelled = true;
    };
  }, [nonce, setLang]);

  useEffect(() => {
    document.documentElement.lang = uiLocale(lang);
  }, [lang]);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      languages: state.languages,
      loading: state.loading,
      error: state.error,
      reload: () => setNonce((n) => n + 1),
    }),
    [lang, setLang, t, state],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

const defaultT = (key, params) => translate(DEFAULT_LANGUAGE, key, params);

/** Translator for components and hooks; outside a provider (isolated tests) it uses the default language. */
export function useT() {
  return useContext(LanguageContext)?.t ?? defaultT;
}
