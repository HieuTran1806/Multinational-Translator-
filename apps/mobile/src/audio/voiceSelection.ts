/** Device voice selection rules (pure, unit-tested). */
export interface DeviceVoice {
  id: string;
  name: string;
  language: string; // e.g. "vi-VN", "en_US"
  quality: number;
  networkConnectionRequired: boolean;
  notInstalled: boolean;
}

export type VoiceProblem =
  | 'NO_VOICE_FOR_LANGUAGE' // engine has no voice at all for this language
  | 'VOICE_NOT_INSTALLED' // voices exist but their data is not downloaded
  | 'NO_OFFLINE_VOICE'; // only network voices exist and we are offline

export type VoicePick = { ok: true; voice: DeviceVoice } | { ok: false; problem: VoiceProblem };

const ISO3: Record<string, string> = { vi: 'vie', en: 'eng', ja: 'jpn', fr: 'fra', ko: 'kor', zh: 'zho' };

export function voiceMatchesLanguage(voiceLanguage: string, lang: string): boolean {
  const primary = voiceLanguage.toLowerCase().replace('_', '-').split('-')[0];
  const want = lang.toLowerCase().split('-')[0];
  return primary === want || primary === ISO3[want];
}

/**
 * Never returns a voice of another language. When offline only voices that do not need the network
 * are acceptable.
 */
export function pickVoice(voices: DeviceVoice[], lang: string, offline: boolean): VoicePick {
  const forLang = voices.filter(v => voiceMatchesLanguage(v.language, lang));
  if (forLang.length === 0) {
    return { ok: false, problem: 'NO_VOICE_FOR_LANGUAGE' };
  }
  const installed = forLang.filter(v => !v.notInstalled);
  if (installed.length === 0) {
    return { ok: false, problem: 'VOICE_NOT_INSTALLED' };
  }
  const usable = offline ? installed.filter(v => !v.networkConnectionRequired) : installed;
  if (usable.length === 0) {
    return { ok: false, problem: 'NO_OFFLINE_VOICE' };
  }
  const sorted = [...usable].sort((a, b) => {
    // prefer embedded (offline-capable) voices, then quality
    if (a.networkConnectionRequired !== b.networkConnectionRequired) {
      return a.networkConnectionRequired ? 1 : -1;
    }
    return (b.quality ?? 0) - (a.quality ?? 0);
  });
  return { ok: true, voice: sorted[0] };
}

/** Splits long text for engines with an input limit (Android ≈ 4000 chars). */
export function chunkText(text: string, maxLen = 3500): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) {
    return clean ? [clean] : [];
  }
  const sentences = clean.match(/[^.!?。]+[.!?。]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxLen) {
      if (current) {
        chunks.push(current.trim());
      }
      if (s.length > maxLen) {
        for (let i = 0; i < s.length; i += maxLen) {
          chunks.push(s.slice(i, i + maxLen).trim());
        }
        current = '';
        continue;
      }
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}
