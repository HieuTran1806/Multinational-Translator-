import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ApiRequestError } from '../api/client';
import { Banner, EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import type { RootStackParamList } from '../navigation/types';
import { useOnline } from '../network/useOnline';
import { sqliteOfflineStore } from '../offline/sqliteOfflineStore';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

interface Row {
  id: number;
  name: string;
  subtitle: string;
  downloaded: boolean;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PoiListScreen() {
  const { api, t, narrationLanguage, offlineRevision } = useApp();
  const online = useOnline();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lang = narrationLanguage ?? 'vi';

  const loadOffline = useCallback(async () => {
    const saved = await sqliteOfflineStore.listPois();
    setRows(saved.map(p => {
      const tr = p.manifest.translations.find(x => x.languageCode === lang) ?? p.manifest.translations[0];
      return { id: p.poiId, name: tr?.name ?? p.name, subtitle: p.code, downloaded: true };
    }));
    setOfflineMode(true);
  }, [lang]);

  const load = useCallback(async () => {
    setError(null);
    if (online === false) {
      await loadOffline();
      return;
    }
    try {
      const [page, saved] = await Promise.all([api.listPublished(lang), sqliteOfflineStore.listPois()]);
      const savedIds = new Set(saved.map(s => s.poiId));
      setRows(page.items.map(p => ({ id: p.id, name: p.name, subtitle: p.code, downloaded: savedIds.has(p.id) })));
      setOfflineMode(false);
    } catch (e) {
      const err = e instanceof ApiRequestError ? e : new ApiRequestError('UNKNOWN', String(e), 0);
      if (err.isNetwork) {
        await loadOffline(); // server unreachable: fall back to downloaded content
      }
      setError(err);
    }
  }, [api, lang, online, loadOffline]);

  useEffect(() => {
    if (online !== null) {
      load();
    }
  }, [load, online, offlineRevision]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (rows === null && !error) {
    return <LoadingView label={t.loadingPois} />;
  }
  if (rows === null && error) {
    return <ErrorView title={t.loadError} message={error.isNetwork ? t.networkError : error.message} onRetry={load} retryLabel={t.retry} />;
  }

  return (
    <View style={styles.root}>
      {offlineMode && <View style={styles.bannerWrap}><Banner kind="warning" message={error?.isNetwork ? t.networkError : t.offlineBanner} /></View>}
      <FlatList
        data={rows ?? []}
        keyExtractor={r => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={rows && rows.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={<EmptyView message={offlineMode ? t.offlineEmpty : t.noPois} action={{ label: t.retry, onPress: load }} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => navigation.navigate('PoiDetail', { poiId: item.id, title: item.name })}
          >
            <View style={styles.cardText}>
              <Text style={font.h3}>{item.name}</Text>
              <Text style={font.caption}>{item.subtitle}</Text>
            </View>
            {item.downloaded && <Text style={styles.badge}>{t.downloaded}</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  bannerWrap: { padding: spacing.md },
  listContent: { padding: spacing.lg, gap: spacing.md },
  emptyContainer: { flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, padding: spacing.lg,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.8 },
  cardText: { flex: 1, gap: 2 },
  badge: {
    color: colors.forest, backgroundColor: '#E3E8D8', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.pill, fontSize: 12, overflow: 'hidden',
  },
});
