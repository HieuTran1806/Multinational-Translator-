import { getDb } from './db';

export const SettingKeys = {
  narrationLanguage: 'narration_language',
  apiBaseUrl: 'api_base_url',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const r = await db.execute('SELECT value FROM kv WHERE key = ?', [key]);
  const v = r.rows[0]?.value;
  return typeof v === 'string' ? v : null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = await getDb();
  if (value === null) {
    await db.execute('DELETE FROM kv WHERE key = ?', [key]);
  } else {
    await db.execute('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, value]);
  }
}
