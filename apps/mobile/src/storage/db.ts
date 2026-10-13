import { open, type DB } from '@op-engineering/op-sqlite';

/**
 * SQLite (op-sqlite) holds settings and offline metadata/content.
 * Audio files themselves live on the filesystem (see offline/fsAdapter.ts).
 */
const MIGRATIONS: string[][] = [
  [
    `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS offline_poi (
        poi_id INTEGER PRIMARY KEY NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        manifest_version TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DOWNLOADING','READY','PARTIAL','FAILED')),
        total_bytes INTEGER NOT NULL DEFAULT 0,
        image_path TEXT,
        error TEXT,
        downloaded_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS offline_audio (
        poi_id INTEGER NOT NULL REFERENCES offline_poi(poi_id) ON DELETE CASCADE,
        language_code TEXT NOT NULL,
        content_version INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('READY','FAILED')),
        error TEXT,
        PRIMARY KEY (poi_id, language_code)
     )`,
  ],
];

let db: DB | null = null;

export async function getDb(): Promise<DB> {
  if (db) {
    return db;
  }
  const d = open({ name: 'thuyetminh.sqlite' });
  await d.execute('PRAGMA foreign_keys = ON');
  const res = await d.execute('PRAGMA user_version');
  const current = Number(res.rows[0]?.user_version ?? 0);
  for (let v = current; v < MIGRATIONS.length; v++) {
    await d.transaction(async tx => {
      for (const sql of MIGRATIONS[v]) {
        await tx.execute(sql);
      }
      await tx.execute(`PRAGMA user_version = ${v + 1}`);
    });
  }
  db = d;
  return d;
}
