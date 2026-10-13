import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiRequestError } from '../api/client';
import { checkDeviceVoice, deviceVoiceSupportsPause, requestVoiceInstall, type DeviceVoiceCheck } from '../audio/deviceTts';
import { narration } from '../audio/narrationController';
import { resolveNarrationSource, type NarrationSource } from '../audio/sourceResolver';
import { useNarrationState } from '../audio/useNarration';
import { NarrationControls } from '../components/NarrationControls';
import { AppButton, Banner, ErrorView, LoadingView } from '../components/StateViews';
import type { RootStackParamList } from '../navigation/types';
import { useOnline } from '../network/useOnline';
import type { OfflineAudioRecord, OfflinePoiRecord } from '../offline/types';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PoiDetail'>;

interface Content {
  name: string;
  description: string | null;
  narrationText: string;
  contentVersion: number;
  language: string;
  fallback: boolean;
  availableLanguages: string[];
  imageUri: string | null;
  remote: { url: string; contentVersion: number } | null;
  fromOffline: boolean;
}

const LANG_LABEL: Record<string, string> = { vi: 'Tiếng Việt', en: 'English' };

export default function PoiDetailScreen({ route, navigation }: Props) {
  const { poiId } = route.params;
  const { api, offline, t, narrationLanguage, notifyOfflineChanged } = useApp();
  const online = useOnline();
  const playback = useNarrationState();
  const [lang, setLang] = useState(narrationLanguage ?? 'vi');
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<{ title: string; message?: string } | null>(null);
  const [offlineRec, setOfflineRec] = useState<OfflinePoiRecord | null>(null);
  const [localAudio, setLocalAudio] = useState<OfflineAudioRecord | null>(null);
  const [download, setDownload] = useState<{ busy: boolean; done: number; total: number; error: string | null }>(
    { busy: false, done: 0, total: 0, error: null });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [voiceCheck, setVoiceCheck] = useState<DeviceVoiceCheck | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setVoiceCheck(null);
    const rec = await offline.quickVerify(poiId);
    setOfflineRec(rec);
    const loadOffline = async (): Promise<boolean> => {
      const oc = await offline.getOfflineContent(poiId, lang);
      if (!oc) {
        return false;
      }
      setContent({
        name: oc.translation.name,
        description: oc.translation.description,
        narrationText: oc.translation.narrationText,
        contentVersion: oc.translation.contentVersion,
        language: oc.translation.languageCode,
        fallback: oc.fallback,
        availableLanguages: oc.poi.manifest.translations.map(x => x.languageCode),
        imageUri: oc.poi.imagePath ? `file://${oc.poi.imagePath}` : null,
        remote: null,
        fromOffline: true,
      });
      setLocalAudio(oc.audio);
      return true;
    };

    if (online === false) {
      if (!(await loadOffline())) {
        setError({ title: t.loadError, message: t.offlineEmpty });
      }
      return;
    }
    try {
      const d = await api.detail(poiId, lang);
      setContent({
        name: d.name,
        description: d.description,
        narrationText: d.narrationText,
        contentVersion: d.contentVersion,
        language: d.language,
        fallback: d.fallback,
        availableLanguages: d.availableLanguages,
        imageUri: d.imageUrl ? api.absoluteUrl(d.imageUrl) : null,
        remote: d.audio ? { url: api.absoluteUrl(d.audio.url), contentVersion: d.audio.contentVersion } : null,
        fromOffline: false,
      });
      const audios = rec ? await offline.getOfflineContent(poiId, d.language) : null;
      setLocalAudio(audios?.audio && audios.translation.languageCode === d.language ? audios.audio : null);
      if (rec) {
        offline.hasUpdate(poiId).then(setUpdateAvailable).catch(() => undefined);
      }
    } catch (e) {
      const err = e as ApiRequestError;
      if (err?.isNetwork && (await loadOffline())) {
        return;
      }
      setError(err?.isNotFound
        ? { title: t.poiNotFound }
        : { title: t.loadError, message: err?.isNetwork ? t.networkError : err?.message });
    }
  }, [api, offline, poiId, lang, online, t]);

  useEffect(() => {
    if (online !== null) {
      load();
    }
  }, [load, online]);

  useEffect(() => {
    if (content?.name) {
      navigation.setOptions({ title: content.name });
    }
  }, [navigation, content?.name]);

  // Leaving the screen or switching language stops the current narration (no overlapping audio).
  useEffect(() => () => {
    narration.stop();
  }, []);
  useEffect(() => {
    narration.stop();
  }, [lang]);

  const sessionKey = `poi:${poiId}:${content?.language ?? lang}`;
  const source: NarrationSource | null = useMemo(() => {
    if (!content) {
      return null;
    }
    return resolveNarrationSource({
      contentVersion: content.contentVersion,
      narrationText: content.narrationText,
      online: online !== false,
      local: localAudio && localAudio.status === 'READY'
        ? { path: localAudio.filePath, contentVersion: localAudio.contentVersion, verified: true }
        : null,
      remote: content.remote,
    });
  }, [content, localAudio, online]);

  if (error) {
    return <ErrorView title={error.title} message={error.message} onRetry={load} retryLabel={t.retry} />;
  }
  if (!content || !source) {
    return <LoadingView label={t.loading} />;
  }

  const onPlay = () => {
    if (source.kind === 'local') {
      narration.playFile(sessionKey, source.path);
    } else if (source.kind === 'remote') {
      narration.playFile(sessionKey, source.url);
    }
  };

  const onDeviceVoice = async () => {
    const check = await checkDeviceVoice(content.language, online === false);
    setVoiceCheck(check);
    if (check.ok) {
      narration.playDeviceVoice(`${sessionKey}:device`, content.narrationText, check.voiceId);
    }
  };

  const onDownload = async () => {
    setDownload({ busy: true, done: 0, total: 0, error: null });
    try {
      const rec = await offline.downloadPoi(poiId, p => setDownload(d => ({ ...d, done: p.done, total: p.total })));
      setDownload({ busy: false, done: 0, total: 0, error: rec.status === 'READY' ? null : t.partial });
      setUpdateAvailable(false);
    } catch (e) {
      setDownload({ busy: false, done: 0, total: 0, error: e instanceof Error ? e.message : t.downloadFailed });
    }
    notifyOfflineChanged();
    load();
  };

  const onDelete = () => {
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await narration.stop();
          await offline.deletePoi(poiId);
          notifyOfflineChanged();
          load();
        },
      },
    ]);
  };

  const sourceLabel = source.kind === 'local' ? t.sourceLocal : source.kind === 'remote' ? t.sourceRemote : null;
  const deviceKey = `${sessionKey}:device`;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {content.imageUri ? <Image source={{ uri: content.imageUri }} style={styles.image} accessibilityIgnoresInvertColors /> : (
        <View style={[styles.image, styles.imagePlaceholder]}><Text style={font.caption}>Củ Chi</Text></View>
      )}
      {content.fromOffline && <Banner kind="info" message={t.offlineBanner} />}
      {content.fallback && <Banner kind="warning" message={t.fallbackNotice} />}

      <Text style={font.h1}>{content.name}</Text>
      {content.description ? <Text style={font.body}>{content.description}</Text> : null}
      {content.name.includes('[DEMO]') && <Text style={font.caption}>{t.demoNotice}</Text>}

      <Text style={[font.h3, styles.section]}>{t.narrationLanguage}</Text>
      <View style={styles.chips}>
        {content.availableLanguages.map(code => {
          const selected = code === content.language;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setLang(code)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{LANG_LABEL[code] ?? code}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[font.h3, styles.section]}>{t.narration}</Text>
      {(source.kind === 'local' || source.kind === 'remote') && (
        <NarrationControls
          t={t}
          state={playback}
          sessionKey={sessionKey}
          sourceLabel={sourceLabel}
          canPause
          onPlay={onPlay}
          onPause={() => narration.pause()}
          onResume={() => narration.resume()}
          onStop={() => narration.stop()}
        />
      )}
      {source.kind === 'device-suggested' && (
        <View style={styles.box}>
          <Text style={font.body}>
            {source.reason === 'OFFLINE_NO_LOCAL_AUDIO' || online === false ? t.noAudioOfflineSuggestDevice : t.noAudioSuggestDevice}
          </Text>
          {playback.key === deviceKey ? (
            <NarrationControls
              t={t}
              state={playback}
              sessionKey={deviceKey}
              sourceLabel={t.sourceDevice}
              canPause={deviceVoiceSupportsPause}
              onPlay={onDeviceVoice}
              onPause={() => narration.pause()}
              onResume={() => narration.resume()}
              onStop={() => narration.stop()}
            />
          ) : (
            <AppButton label={t.useDeviceVoice} onPress={onDeviceVoice} />
          )}
          {voiceCheck && !voiceCheck.ok && (
            <View style={styles.gap}>
              <Banner
                kind="warning"
                message={voiceCheck.problem === 'NO_ENGINE' ? t.noTtsEngine
                  : online === false ? t.deviceVoiceMissingOffline : t.deviceVoiceMissing}
              />
              {Platform.OS === 'android' && online !== false && voiceCheck.problem !== 'NO_ENGINE' && (
                <AppButton variant="secondary" label={t.installVoice} onPress={() => requestVoiceInstall()} />
              )}
            </View>
          )}
        </View>
      )}

      <Text style={[font.h3, styles.section]}>{t.offlineTitle}</Text>
      <View style={styles.box}>
        {download.busy ? (
          <Text style={font.body}>{t.downloading} {download.total ? `${download.done}/${download.total}` : ''}</Text>
        ) : offlineRec ? (
          <>
            <Text style={font.body}>
              {offlineRec.status === 'READY' ? t.downloaded : offlineRec.status === 'PARTIAL' ? t.partial : t.downloadFailed}
              {offlineRec.error ? ` · ${offlineRec.error}` : ''}
            </Text>
            <View style={styles.row}>
              {(updateAvailable || offlineRec.status !== 'READY') && online !== false && (
                <AppButton compact label={updateAvailable ? t.update : t.retry} onPress={onDownload} />
              )}
              <AppButton compact variant="secondary" label={t.delete} onPress={onDelete} />
            </View>
            {updateAvailable && <Text style={font.caption}>{t.updateAvailable}</Text>}
          </>
        ) : (
          <AppButton label={t.download} onPress={onDownload} disabled={online === false} />
        )}
        {download.error && <Banner kind="error" message={download.error} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  image: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.sand },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.sand },
  chipSelected: { backgroundColor: colors.olive },
  chipText: { color: colors.charcoal, fontWeight: '600' },
  chipTextSelected: { color: colors.paper },
  box: { backgroundColor: colors.sand, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  gap: { gap: spacing.sm },
});
