/**
 * Decides HOW to narrate, in priority order (pure function, unit-tested):
 *  1. a downloaded audio file that passed integrity checks and matches the shown content version;
 *  2. online audio for the same content version, when the device is online;
 *  3. otherwise SUGGEST the device voice (react-native-tts) — the user must confirm.
 * Audio for an older content version is never used.
 */
export interface LocalAudioRef {
  path: string;
  contentVersion: number;
  verified: boolean;
}

export interface RemoteAudioRef {
  url: string;
  contentVersion: number;
}

export type NarrationSource =
  | { kind: 'local'; path: string }
  | { kind: 'remote'; url: string }
  | { kind: 'device-suggested'; reason: 'NO_AUDIO' | 'OFFLINE_NO_LOCAL_AUDIO' }
  | { kind: 'none'; reason: 'NO_TEXT' };

export interface ResolveInput {
  contentVersion: number;
  narrationText: string;
  online: boolean;
  local?: LocalAudioRef | null;
  remote?: RemoteAudioRef | null;
}

export function resolveNarrationSource(input: ResolveInput): NarrationSource {
  const { local, remote, contentVersion, online } = input;
  if (local && local.verified && local.contentVersion === contentVersion) {
    return { kind: 'local', path: local.path };
  }
  if (online && remote && remote.contentVersion === contentVersion) {
    return { kind: 'remote', url: remote.url };
  }
  if (!input.narrationText || !input.narrationText.trim()) {
    return { kind: 'none', reason: 'NO_TEXT' };
  }
  const hadRemote = !!remote && remote.contentVersion === contentVersion;
  return { kind: 'device-suggested', reason: !online && hadRemote ? 'OFFLINE_NO_LOCAL_AUDIO' : 'NO_AUDIO' };
}
