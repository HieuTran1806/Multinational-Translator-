import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NarrationState } from '../audio/narrationController';
import type { Strings } from '../i18n/strings';
import { colors, font, radius, spacing } from '../theme';
import { AppButton } from './StateViews';

/** Play / Pause / Stop for the narration bound to `sessionKey`. */
export function NarrationControls({ t, state, sessionKey, sourceLabel, onPlay, onPause, onResume, onStop, canPause }: {
  t: Strings;
  state: NarrationState;
  sessionKey: string;
  sourceLabel: string | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  canPause: boolean;
}) {
  const mine = state.key === sessionKey;
  const s = mine ? state.state : 'idle';
  const statusText =
    s === 'loading' ? t.preparingAudio
      : s === 'playing' ? t.playing
        : s === 'paused' ? t.paused
          : s === 'stopped' || s === 'ended' ? t.stopped
            : s === 'error' ? t.audioError
              : '';
  return (
    <View style={styles.box}>
      {sourceLabel ? <Text style={font.caption}>{sourceLabel}</Text> : null}
      {statusText ? (
        <Text style={[font.body, s === 'error' && styles.error]} accessibilityLiveRegion="polite">{statusText}</Text>
      ) : null}
      <View style={styles.row}>
        {(s === 'idle' || s === 'stopped' || s === 'ended' || s === 'error') && (
          <AppButton label={`▶ ${t.play}`} onPress={onPlay} />
        )}
        {s === 'playing' && canPause && <AppButton label={`❚❚ ${t.pause}`} onPress={onPause} />}
        {s === 'paused' && <AppButton label={`▶ ${t.resume}`} onPress={onResume} />}
        {(s === 'playing' || s === 'paused' || s === 'loading') && (
          <AppButton variant="secondary" label={`■ ${t.stop}`} onPress={onStop} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.sand, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  error: { color: colors.danger },
});
