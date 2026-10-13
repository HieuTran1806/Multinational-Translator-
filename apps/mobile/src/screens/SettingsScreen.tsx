import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Language } from '../api/types';
import { narration } from '../audio/narrationController';
import { AppButton, Banner } from '../components/StateViews';
import { defaultApiBaseUrl, isMapsConfigured, isValidBaseUrl } from '../config/env';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';
import { BUILTIN_LANGUAGES, LanguagePicker } from './LanguageSelectScreen';

/** M11 Profile/Settings container (guest mode: no account section in the MVP). */
export default function SettingsScreen() {
  const { t, api, narrationLanguage, setNarrationLanguage, apiBaseUrl, apiBaseUrlOverridden, setApiBaseUrl } = useApp();
  const [languages, setLanguages] = useState<Language[]>(BUILTIN_LANGUAGES);
  const [url, setUrl] = useState(apiBaseUrl);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.languages().then(ls => ls.length && setLanguages(ls)).catch(() => undefined);
  }, [api]);

  const saveUrl = async () => {
    if (!isValidBaseUrl(url)) {
      setMsg({ kind: 'error', text: t.invalidUrl });
      return;
    }
    await setApiBaseUrl(url);
    setMsg({ kind: 'success', text: t.saved });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={font.h3}>{t.narrationLanguage}</Text>
      <LanguagePicker
        value={narrationLanguage}
        languages={languages}
        onChange={async code => {
          await narration.stop();
          await setNarrationLanguage(code);
        }}
      />

      <Text style={[font.h3, styles.section]}>{t.serverAddress}</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
        accessibilityLabel={t.serverAddress}
      />
      <Text style={font.caption}>{t.serverAddressHint}</Text>
      <View style={styles.row}>
        <AppButton compact label={t.save} onPress={saveUrl} />
        {apiBaseUrlOverridden && (
          <AppButton compact variant="secondary" label={t.reset} onPress={async () => {
            await setApiBaseUrl(null);
            setUrl(defaultApiBaseUrl());
            setMsg({ kind: 'success', text: t.saved });
          }} />
        )}
      </View>
      {msg && <Banner kind={msg.kind} message={msg.text} />}

      <Text style={[font.h3, styles.section]}>Google Maps</Text>
      <Text style={font.caption}>{isMapsConfigured() ? 'API key: OK' : t.mapNotConfigured}</Text>
      <Text style={[font.caption, styles.section]}>{t.demoNotice}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  section: { marginTop: spacing.lg },
  input: {
    borderWidth: 1, borderColor: '#D8CFBC', borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, backgroundColor: colors.white, color: colors.charcoal,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
});
