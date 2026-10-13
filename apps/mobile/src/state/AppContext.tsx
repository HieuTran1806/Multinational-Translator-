import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient } from '../api/client';
import { createPoiApi, type PoiApi } from '../api/poiApi';
import { defaultApiBaseUrl, stripSlash } from '../config/env';
import { strings, uiLanguageFor, type Strings } from '../i18n/strings';
import { rnfsAdapter } from '../offline/fsAdapter';
import { createOfflineManager, type OfflineManager } from '../offline/offlineManager';
import { sqliteOfflineStore } from '../offline/sqliteOfflineStore';
import { getSetting, setSetting, SettingKeys } from '../storage/settingsRepo';

interface AppContextValue {
  ready: boolean;
  /** null until the user picks one on first launch */
  narrationLanguage: string | null;
  setNarrationLanguage: (lang: string) => Promise<void>;
  apiBaseUrl: string;
  apiBaseUrlOverridden: boolean;
  setApiBaseUrl: (url: string | null) => Promise<void>;
  t: Strings;
  api: PoiApi;
  offline: OfflineManager;
  /** bumps when offline data changes so lists can refresh */
  offlineRevision: number;
  notifyOfflineChanged: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [narrationLanguage, setLang] = useState<string | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [offlineRevision, setOfflineRevision] = useState(0);
  const baseRef = useRef(defaultApiBaseUrl());
  const apiBaseUrl = override ?? defaultApiBaseUrl();

  useEffect(() => {
    baseRef.current = apiBaseUrl;
  }, [apiBaseUrl]);

  useEffect(() => {
    (async () => {
      try {
        const [lang, url] = await Promise.all([
          getSetting(SettingKeys.narrationLanguage),
          getSetting(SettingKeys.apiBaseUrl),
        ]);
        setLang(lang);
        if (url) {
          baseRef.current = url;
          setOverride(url);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const api = useMemo(() => createPoiApi(createApiClient(() => baseRef.current)), []);
  const offline = useMemo(
    () =>
      createOfflineManager({
        fs: rnfsAdapter,
        store: sqliteOfflineStore,
        fetchManifest: id => api.manifest(id),
        absoluteUrl: rel => api.absoluteUrl(rel),
      }),
    [api],
  );

  const setNarrationLanguage = useCallback(async (lang: string) => {
    setLang(lang);
    await setSetting(SettingKeys.narrationLanguage, lang);
  }, []);

  const setApiBaseUrl = useCallback(async (url: string | null) => {
    const v = url ? stripSlash(url.trim()) : null;
    baseRef.current = v ?? defaultApiBaseUrl();
    setOverride(v);
    await setSetting(SettingKeys.apiBaseUrl, v);
  }, []);

  const notifyOfflineChanged = useCallback(() => setOfflineRevision(n => n + 1), []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      narrationLanguage,
      setNarrationLanguage,
      apiBaseUrl,
      apiBaseUrlOverridden: override !== null,
      setApiBaseUrl,
      t: strings[uiLanguageFor(narrationLanguage ?? 'vi')],
      api,
      offline,
      offlineRevision,
      notifyOfflineChanged,
    }),
    [ready, narrationLanguage, setNarrationLanguage, apiBaseUrl, override, setApiBaseUrl, api, offline,
      offlineRevision, notifyOfflineChanged],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return v;
}
