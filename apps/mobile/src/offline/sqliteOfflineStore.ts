import { getDb } from '../storage/db';
import type { OfflineAudioRecord, OfflinePoiRecord, OfflineStore } from './types';

type Row = Record<string, unknown>;

function toPoi(r: Row): OfflinePoiRecord {
  return {
    poiId: Number(r.poi_id),
    code: String(r.code),
    name: String(r.name),
    manifestVersion: String(r.manifest_version),
    manifest: JSON.parse(String(r.manifest_json)),
    status: r.status as OfflinePoiRecord['status'],
    totalBytes: Number(r.total_bytes),
    imagePath: (r.image_path as string | null) ?? null,
    error: (r.error as string | null) ?? null,
    downloadedAt: String(r.downloaded_at),
  };
}

function toAudio(r: Row): OfflineAudioRecord {
  return {
    poiId: Number(r.poi_id),
    languageCode: String(r.language_code),
    contentVersion: Number(r.content_version),
    assetId: Number(r.asset_id),
    filePath: String(r.file_path),
    sha256: String(r.sha256),
    sizeBytes: Number(r.size_bytes),
    status: r.status as OfflineAudioRecord['status'],
    error: (r.error as string | null) ?? null,
  };
}

export const sqliteOfflineStore: OfflineStore = {
  async upsertPoi(p) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO offline_poi (poi_id, code, name, manifest_version, manifest_json, status, total_bytes, image_path, error, downloaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(poi_id) DO UPDATE SET code=excluded.code, name=excluded.name,
         manifest_version=excluded.manifest_version, manifest_json=excluded.manifest_json, status=excluded.status,
         total_bytes=excluded.total_bytes, image_path=excluded.image_path, error=excluded.error,
         downloaded_at=excluded.downloaded_at`,
      [p.poiId, p.code, p.name, p.manifestVersion, JSON.stringify(p.manifest), p.status, p.totalBytes,
        p.imagePath, p.error, p.downloadedAt],
    );
  },
  async getPoi(poiId) {
    const db = await getDb();
    const r = await db.execute('SELECT * FROM offline_poi WHERE poi_id = ?', [poiId]);
    return r.rows[0] ? toPoi(r.rows[0]) : null;
  },
  async listPois() {
    const db = await getDb();
    const r = await db.execute('SELECT * FROM offline_poi ORDER BY name');
    return r.rows.map(toPoi);
  },
  async deletePoi(poiId) {
    const db = await getDb();
    await db.execute('DELETE FROM offline_audio WHERE poi_id = ?', [poiId]);
    await db.execute('DELETE FROM offline_poi WHERE poi_id = ?', [poiId]);
  },
  async upsertAudio(a) {
    const db = await getDb();
    await db.execute(
      `INSERT OR REPLACE INTO offline_audio (poi_id, language_code, content_version, asset_id, file_path, sha256, size_bytes, status, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.poiId, a.languageCode, a.contentVersion, a.assetId, a.filePath, a.sha256, a.sizeBytes, a.status, a.error],
    );
  },
  async listAudio(poiId) {
    const db = await getDb();
    const r = await db.execute('SELECT * FROM offline_audio WHERE poi_id = ?', [poiId]);
    return r.rows.map(toAudio);
  },
  async deleteAudio(poiId, languageCode) {
    const db = await getDb();
    await db.execute('DELETE FROM offline_audio WHERE poi_id = ? AND language_code = ?', [poiId, languageCode]);
  },
};
