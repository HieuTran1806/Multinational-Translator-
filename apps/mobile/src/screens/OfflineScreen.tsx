import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyView } from '../components/StateViews';
import { AppButton, Banner } from '../components/StateViews';
import type { RootStackParamList } from '../navigation/types';
import { useOnline } from '../network/useOnline';
import { sqliteOfflineStore } from '../offline/sqliteOfflineStore';
import type { OfflinePoiRecord } from '../offline/types';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';
import { formatBytes } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** M10 Offline Management (audio/content packs only — no map packs in the MVP). */
export default function OfflineScreen() {
  const { offline, t, offlineRevision, notifyOfflineChanged } = useApp();
  const online = useOnline();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<OfflinePoiRecord[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await sqliteOfflineStore.listPois();
    const verified = await Promise.all(list.map(p => offline.quickVerify(p.poiId)));
    setItems(verified.filter((p): p is OfflinePoiRecord => p !== null));
  }, [offline]);

  useEffect(() => {
    load();
  }, [load, offlineRevision]);

  const remove = (p: OfflinePoiRecord) =>
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await offline.deletePoi(p.poiId);
          notifyOfflineChanged();
        },
      },
    ]);

  const redownload = async (p: OfflinePoiRecord) => {
    setBusyId(p.poiId);
    setMessage(null);
    try {
      await offline.downloadPoi(p.poiId);
    } catch (e) {
      setMessage(`${t.downloadFailed}: ${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusyId(null);
      notifyOfflineChanged();
    }
  };

  const total = (items ?? []).reduce((s, p) => s + p.totalBytes, 0);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={font.caption}>{t.offlineHint}</Text>
        {items && items.length > 0 && <Text style={font.caption}>{t.storageUsed}: {formatBytes(total)}</Text>}
        {message && <Banner kind="error" message={message} />}
      </View>
      <FlatList
        data={items ?? []}
        keyExtractor={p => String(p.poiId)}
        contentContainerStyle={items && items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyView message={t.noOfflineData} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => navigation.navigate('PoiDetail', { poiId: item.poiId, title: item.name })}>
              <Text style={font.h3}>{item.name}</Text>
              <Text style={font.caption}>
                {item.manifest.translations.map(x => x.languageCode.toUpperCase()).join(' · ')} · {formatBytes(item.totalBytes)}
              </Text>
              <Text style={[styles.status, item.status !== 'READY' && styles.statusWarn]}>
                {busyId === item.poiId ? t.downloading
                  : item.status === 'READY' ? t.downloaded : item.status === 'PARTIAL' ? t.partial : t.downloadFailed}
                {item.error ? ` · ${item.error}` : ''}
              </Text>
            </Pressable>
            <View style={styles.row}>
              {online !== false && (
                <AppButton compact label={item.status === 'READY' ? t.update : t.retry} onPress={() => redownload(item)}
                  disabled={busyId !== null} />
              )}
              <AppButton compact variant="secondary" label={t.delete} onPress={() => remove(item)} disabled={busyId === item.poiId} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: { padding: spacing.lg, gap: spacing.sm },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  empty: { flexGrow: 1 },
  card: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  status: { color: colors.forest, marginTop: spacing.xs },
  statusWarn: { color: colors.terracotta },
});
