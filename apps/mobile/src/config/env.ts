import { Platform } from 'react-native';
import Config from 'react-native-config';

/**
 * Default backend address when no in-app override is set:
 * - Android emulator: 10.0.2.2 is the host machine's loopback.
 * - iOS simulator: localhost reaches the host machine.
 * - Physical phone: "localhost" is the PHONE itself. Use the dev machine's LAN IP
 *   (e.g. http://192.168.1.20:8080) via .env API_BASE_URL or Settings → Địa chỉ máy chủ.
 */
export function defaultApiBaseUrl(): string {
  const fromEnv = (Config.API_BASE_URL ?? '').trim();
  if (fromEnv) {
    return stripSlash(fromEnv);
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

/** Whether a Google Maps key was provided at build time (value itself is not secret but restricted). */
export function isMapsConfigured(): boolean {
  const key = Platform.OS === 'android' ? Config.GOOGLE_MAPS_ANDROID_API_KEY : Config.GOOGLE_MAPS_IOS_API_KEY;
  return !!key && key.trim().length > 0 && !key.includes('REPLACE_ME');
}

export function stripSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function isValidBaseUrl(url: string): boolean {
  return /^https?:\/\/[^\s/]+(:\d+)?(\/.*)?$/i.test(url.trim());
}
