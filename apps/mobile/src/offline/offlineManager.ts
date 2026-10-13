import type { OfflineManifest, OfflineTranslation } from '../api/types';
import type { FileSystemPort, OfflineAudioRecord, OfflinePoiRecord, OfflineStore } from './types';

export interface OfflineManagerDeps {
  fs: FileSystemPort;
  store: OfflineStore;
  fetchManifest: (poiId: number) => Promise<OfflineManifest>;
  absoluteUrl: (relative: string) => string;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
}

export type DownloadProgress = { done: number; total: number };

export class IntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrityError';
  }
}

/**
 * Downloads a POI's content + audio for offline use with versioning, integrity checks (size + SHA-256),
 * bounded retries, cleanup of obsolete files, and deletion.
 */
export function createOfflineManager(deps: OfflineManagerDeps) {
  const { fs, store } = deps;
  const maxAttempts = deps.maxAttempts ?? 3;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  const now = deps.now ?? (() => new Date());

  const poiDir = (poiId: number) => `${fs.rootDir}/poi-${poiId}`;
  const audioPath = (poiId: number, t: OfflineTranslation) =>
    `${poiDir(poiId)}/${t.languageCode}-v${t.contentVersion}-${t.audio!.sha256.slice(0, 12)}.${t.audio!.format}`;

  async function verifyFile(path: string, size: number, sha256: string): Promise<boolean> {
    if (!(await fs.exists(path))) {
      return false;
    }
    if ((await fs.size(path)) !== size) {
      return false;
    }
    return (await fs.sha256(path)).toLowerCase() === sha256.toLowerCase();
  }

  async function downloadVerified(url: string, target: string, size: number, sha256: string): Promise<void> {
    const tmp = `${target}.part`;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await fs.unlink(tmp);
        const res = await fs.download(url, tmp);
        if (res.statusCode !== 200) {
          throw new Error(`HTTP_${res.statusCode}`);
        }
        if (!(await verifyFile(tmp, size, sha256))) {
          throw new IntegrityError('CHECKSUM_MISMATCH');
        }
        await fs.unlink(target);
        await fs.move(tmp, target);
        return;
      } catch (e) {
        lastError = e;
        await fs.unlink(tmp).catch(() => undefined);
        if (attempt < maxAttempts) {
          await sleep(1000 * 2 ** (attempt - 1));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('DOWNLOAD_FAILED');
  }

  async function downloadPoi(poiId: number, onProgress?: (p: DownloadProgress) => void): Promise<OfflinePoiRecord> {
    const manifest = await deps.fetchManifest(poiId);
    const withAudio = manifest.translations.filter(t => t.audio);
    const totalBytes = withAudio.reduce((s, t) => s + (t.audio?.sizeBytes ?? 0), 0);
    const previous = await store.getPoi(poiId);
    const base: OfflinePoiRecord = {
      poiId,
      code: manifest.code,
      name: manifest.defaultName,
      manifestVersion: manifest.manifestVersion,
      manifest,
      status: 'DOWNLOADING',
      totalBytes,
      imagePath: previous?.imagePath ?? null,
      error: null,
      downloadedAt: now().toISOString(),
    };
    await store.upsertPoi(base);
    await fs.mkdir(poiDir(poiId));

    const existing = new Map((await store.listAudio(poiId)).map(a => [a.languageCode, a]));
    const keep = new Set<string>();
    let done = 0;
    let failures = 0;
    onProgress?.({ done, total: withAudio.length });

    for (const t of withAudio) {
      const audio = t.audio!;
      const target = audioPath(poiId, t);
      keep.add(target);
      const prev = existing.get(t.languageCode);
      const reusable = prev && prev.status === 'READY' && prev.sha256 === audio.sha256 && prev.filePath === target
        && (await verifyFile(target, audio.sizeBytes, audio.sha256));
      const rec: OfflineAudioRecord = {
        poiId,
        languageCode: t.languageCode,
        contentVersion: t.contentVersion,
        assetId: audio.id,
        filePath: target,
        sha256: audio.sha256,
        sizeBytes: audio.sizeBytes,
        status: 'READY',
        error: null,
      };
      if (!reusable) {
        try {
          await downloadVerified(deps.absoluteUrl(audio.url), target, audio.sizeBytes, audio.sha256);
        } catch (e) {
          failures++;
          rec.status = 'FAILED';
          rec.error = e instanceof Error ? e.message : 'DOWNLOAD_FAILED';
        }
      }
      await store.upsertAudio(rec);
      done++;
      onProgress?.({ done, total: withAudio.length });
    }

    // languages that no longer have audio (or no longer exist) are removed
    for (const [lang, prev] of existing) {
      if (!withAudio.some(t => t.languageCode === lang)) {
        await store.deleteAudio(poiId, lang);
        if (!keep.has(prev.filePath)) {
          await fs.unlink(prev.filePath).catch(() => undefined);
        }
      }
    }

    // image (best effort, not required for offline narration)
    let imagePath = base.imagePath;
    if (manifest.imageUrl) {
      const ext = manifest.imageMimeType === 'image/png' ? 'png' : manifest.imageMimeType === 'image/webp' ? 'webp' : 'jpg';
      const target = `${poiDir(poiId)}/cover-${manifest.manifestVersion}.${ext}`;
      keep.add(target);
      try {
        const res = await fs.download(deps.absoluteUrl(manifest.imageUrl), target);
        imagePath = res.statusCode === 200 ? target : imagePath;
      } catch {
        // keep previous image if any
      }
      if (imagePath) {
        keep.add(imagePath);
      }
    }

    // delete obsolete files (old content versions / temp files)
    for (const f of await fs.listDir(poiDir(poiId))) {
      if (!keep.has(f)) {
        await fs.unlink(f).catch(() => undefined);
      }
    }

    const final: OfflinePoiRecord = {
      ...base,
      imagePath,
      status: failures === 0 ? 'READY' : failures === withAudio.length && withAudio.length > 0 ? 'FAILED' : 'PARTIAL',
      error: failures ? `${failures} file(s) failed` : null,
    };
    await store.upsertPoi(final);
    return final;
  }

  /** Quick check before offline use: files exist and sizes match; marks broken audio FAILED. */
  async function quickVerify(poiId: number): Promise<OfflinePoiRecord | null> {
    const poi = await store.getPoi(poiId);
    if (!poi) {
      return null;
    }
    let broken = 0;
    for (const a of await store.listAudio(poiId)) {
      if (a.status !== 'READY') {
        broken++;
        continue;
      }
      const ok = (await fs.exists(a.filePath)) && (await fs.size(a.filePath)) === a.sizeBytes;
      if (!ok) {
        broken++;
        await store.upsertAudio({ ...a, status: 'FAILED', error: 'FILE_MISSING_OR_CORRUPT' });
      }
    }
    if (broken > 0 && poi.status === 'READY') {
      const updated = { ...poi, status: 'PARTIAL' as const, error: 'Cần tải lại (sửa chữa)' };
      await store.upsertPoi(updated);
      return updated;
    }
    return poi;
  }

  async function deletePoi(poiId: number): Promise<void> {
    for (const f of await fs.listDir(poiDir(poiId))) {
      await fs.unlink(f).catch(() => undefined);
    }
    await fs.unlink(poiDir(poiId)).catch(() => undefined);
    await store.deletePoi(poiId);
  }

  /** True if the server has a newer manifest than the downloaded one. */
  async function hasUpdate(poiId: number): Promise<boolean> {
    const local = await store.getPoi(poiId);
    if (!local) {
      return false;
    }
    const remote = await deps.fetchManifest(poiId);
    return remote.manifestVersion !== local.manifestVersion;
  }

  /** Offline view of one POI in a language (falls back like the server: requested → vi → first). */
  async function getOfflineContent(poiId: number, lang: string) {
    const poi = await store.getPoi(poiId);
    if (!poi) {
      return null;
    }
    const ts = poi.manifest.translations;
    const t = ts.find(x => x.languageCode === lang) ?? ts.find(x => x.languageCode === 'vi') ?? ts[0];
    if (!t) {
      return null;
    }
    const audio = (await store.listAudio(poiId)).find(a => a.languageCode === t.languageCode) ?? null;
    return { poi, translation: t, audio, fallback: t.languageCode !== lang };
  }

  return { downloadPoi, quickVerify, deletePoi, hasUpdate, getOfflineContent, verifyFile };
}

export type OfflineManager = ReturnType<typeof createOfflineManager>;
