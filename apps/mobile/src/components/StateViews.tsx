import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

export function LoadingView({ label }: { label: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.olive} size="large" />
      <Text style={[font.caption, styles.gap]}>{label}</Text>
    </View>
  );
}

export function EmptyView({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.center}>
      <Text style={[font.body, styles.text]}>{message}</Text>
      {action && <AppButton label={action.label} onPress={action.onPress} variant="secondary" />}
    </View>
  );
}

export function ErrorView({ title, message, onRetry, retryLabel }: {
  title: string; message?: string; onRetry?: () => void; retryLabel?: string;
}) {
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Text style={[font.h3, styles.text]}>{title}</Text>
      {message ? <Text style={[font.caption, styles.text]}>{message}</Text> : null}
      {onRetry && <AppButton label={retryLabel ?? 'Retry'} onPress={onRetry} />}
    </View>
  );
}

export function Banner({ kind = 'info', message }: { kind?: 'info' | 'warning' | 'error' | 'success'; message: string }) {
  const bg = { info: colors.sand, warning: '#F6E3CF', error: '#F4DAD5', success: '#E3E8D8' }[kind];
  const fg = { info: colors.charcoal, warning: colors.earth, error: colors.danger, success: colors.forest }[kind];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole={kind === 'error' ? 'alert' : 'text'}>
      <Text style={[styles.bannerText, { color: fg }]}>{message}</Text>
    </View>
  );
}

export function AppButton({ label, onPress, variant = 'primary', disabled, compact }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; compact?: boolean;
}) {
  const bg = variant === 'primary' ? colors.olive : variant === 'danger' ? colors.danger : colors.white;
  const fg = variant === 'secondary' ? colors.forest : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'secondary' && styles.secondary,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  gap: { marginTop: spacing.sm },
  text: { textAlign: 'center' },
  bannerText: { fontSize: 13 },
  banner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  compact: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondary: { borderWidth: 1, borderColor: '#D8CFBC' },
  buttonText: { fontWeight: '600', fontSize: 15 },
});
