import { Platform } from 'react-native';
import Tts from 'react-native-tts';
import { chunkText, pickVoice, type DeviceVoice, type VoiceProblem } from './voiceSelection';

export type DeviceVoiceCheck =
  | { ok: true; voiceId: string; voiceName: string }
  | { ok: false; problem: VoiceProblem | 'NO_ENGINE' | 'TTS_ERROR' };

let finishListener: (() => void) | null = null;
let pendingUtterances = 0;

Tts.addEventListener('tts-finish', () => {
  pendingUtterances = Math.max(0, pendingUtterances - 1);
  if (pendingUtterances === 0 && finishListener) {
    const cb = finishListener;
    finishListener = null;
    cb();
  }
});
Tts.addEventListener('tts-cancel', () => {
  pendingUtterances = 0;
  finishListener = null;
});

/** Checks engine + installed voices for the language before speaking. */
export async function checkDeviceVoice(lang: string, offline: boolean): Promise<DeviceVoiceCheck> {
  try {
    await Tts.getInitStatus();
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'no_engine') {
      return { ok: false, problem: 'NO_ENGINE' };
    }
    return { ok: false, problem: 'TTS_ERROR' };
  }
  try {
    const voices = (await Tts.voices()) as DeviceVoice[];
    const pick = pickVoice(voices, lang, offline);
    if (!pick.ok) {
      return { ok: false, problem: pick.problem };
    }
    return { ok: true, voiceId: pick.voice.id, voiceName: pick.voice.name };
  } catch {
    return { ok: false, problem: 'TTS_ERROR' };
  }
}

export async function speakWithDeviceVoice(text: string, voiceId: string, onDone: () => void): Promise<void> {
  await stopDeviceVoice();
  await Tts.setDefaultVoice(voiceId);
  const chunks = chunkText(text);
  pendingUtterances = chunks.length;
  finishListener = onDone;
  for (const c of chunks) {
    Tts.speak(c, {
      iosVoiceId: voiceId,
      rate: 0.5,
      androidParams: { KEY_PARAM_STREAM: 'STREAM_MUSIC', KEY_PARAM_VOLUME: 1, KEY_PARAM_PAN: 0 },
    });
  }
}

export async function stopDeviceVoice(): Promise<void> {
  finishListener = null;
  pendingUtterances = 0;
  try {
    await Tts.stop();
  } catch {
    // engine not ready
  }
}

/** Android only: opens the system screen to install TTS voice data (needs network). */
export async function requestVoiceInstall(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  try {
    await Tts.requestInstallData();
    return true;
  } catch {
    return false;
  }
}

/** Android TTS cannot pause; iOS can. */
export const deviceVoiceSupportsPause = Platform.OS === 'ios';
