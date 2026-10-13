import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Language } from '../api/types';
import { AppButton } from '../components/StateViews';
import { useApp } from '../state/AppContext';
import { colors, font, radius, spacing } from '../theme';

/** Fallback when the server is unreachable on first launch. */
export const BUILTIN_LANGUAGES: Language[] = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export function LanguagePicker({ value, onChange, languages }: {
  value: string | null; onChange: (code: string) => void; languages: Language[];
}) {
  return (
    <View style={styles.list}>
      {languages.map(l => {
        const selected = l.code === value;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(l.code)}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <View style={styles.itemText}>
              <Text style={font.h3}>{l.nativeName}</Text>
              <Text style={font.caption}>{l.name}</Text>
            </View>
            {selected && <Text style={styles.check}>✓</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function LanguageSelectScreen() {
  const { api, setNarrationLanguage } = useApp();
  const [languages, setLanguages] = useState<Language[]>(BUILTIN_LANGUAGES);
  const [selected, setSelected] = useState<string>('vi');
  const t = selected === 'en' ? 'Choose narration language' : 'Chọn ngôn ngữ thuyết minh';

  useEffect(() => {
    api.languages().then(ls => ls.length && setLanguages(ls)).catch(() => undefined);
  }, [api]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>CỦ CHI TUNNELS</Text>
        <Text style={font.h1}>{t}</Text>
        <Text style={[font.caption, styles.hint]}>
          {selected === 'en'
            ? 'You can change it later in Settings or on a place page.'
            : 'Bạn có thể đổi lại trong Cài đặt hoặc ngay tại trang địa điểm.'}
        </Text>
        <LanguagePicker value={selected} onChange={setSelected} languages={languages} />
        <AppButton label={selected === 'en' ? 'Continue' : 'Tiếp tục'} onPress={() => setNarrationLanguage(selected)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing.xxl, gap: spacing.lg },
  brand: { color: colors.earth, fontWeight: '700', letterSpacing: 1.5, marginTop: spacing.xxl },
  hint: { marginBottom: spacing.sm },
  list: { gap: spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg,
    backgroundColor: colors.paper, borderWidth: 2, borderColor: 'transparent',
  },
  itemSelected: { borderColor: colors.olive },
  itemText: { flex: 1 },
  check: { color: colors.olive, fontSize: 20, fontWeight: '700' },
});
