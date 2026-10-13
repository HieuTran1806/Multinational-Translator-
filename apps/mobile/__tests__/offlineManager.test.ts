import { createHash } from 'crypto';
import type { OfflineManifest } from '../src/api/types';
import { createOfflineManager } from '../src/offline/offlineManager';
import type { FileSystemPort, OfflineAudioRecord, OfflinePoiRecord, OfflineStore } from '../src/offline/types';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

/** In-memory filesystem + "server" files keyed by URL. */
function memoryFs(server: Record<string, string>) {
  const files = new Map<string, string>();
  const calls: string[] = [];
  const fs: FileSystemPort & { files: Map<string, string>; calls: string[]; corruptNext: number } = {
    rootDir: '/docs/offline',
    files,
    calls,
    corruptNext: 0,
    mkdir: async () => undefined,
    exists: async p => files.has(p),
    unlink: async p => {
      for (const k of [...files.keys()]) {
        if (k === p || k.startsWith(`${p}/`)) {
          files.delete(k);
        }
      }
    },
    move: async (a, b) => {
      files.set(b, files.get(a)!);
      files.delete(a);
    },
    size: async p => Buffer.byteLength(files.get(p) ?? ''),
    sha256: async p => sha(files.get(p) ?? ''),
    download: async (url, to) => {
      calls.push(url);
      if (!(url in server)) {
        throw new Error('Network request failed');
      }
      let body = server[url];
      if (fs.corruptNext > 0) {
        fs.corruptNext--;
        body = `${body}-corrupt`;
      }
      files.set(to, body);
      return { statusCode: 200, bytesWritten: Buffer.byteLength(body) };
    },
    listDir: async dir => [...files.keys()].filter(k => k.startsWith(`${dir}/`)),
  };
  return fs;
}

function memoryStore(): OfflineStore {
  const pois = new Map<number, OfflinePoiRecord>();
  const audio = new Map<string, OfflineAudioRecord>();
  return {
    upsertPoi: async p => {
      pois.set(p.poiId, JSON.parse(JSON.stringify(p)));
    },
    getPoi: async id => (pois.has(id) ? JSON.parse(JSON.stringify(pois.get(id)!)) : null),
    listPois: async () => [...pois.values()],
    deletePoi: async id => {
      pois.delete(id);
      for (const k of [...audio.keys()]) {
        if (k.startsWith(`${id}:`)) {
          audio.delete(k);
        }
      }
    },
    upsertAudio: async a => {
      audio.set(`${a.poiId}:${a.languageCode}`, { ...a });
    },
    listAudio: async id => [...audio.values()].filter(a => a.poiId === id),
    deleteAudio: async (id, l) => {
      audio.delete(`${id}:${l}`);
    },
  };
}

function manifest(viText: string, enAudio: string | null, version = 'v1'): OfflineManifest {
  const audio = (id: number, body: string, cv: number) => ({
    id, source: 'UPLOAD' as const, format: 'mp3', mimeType: 'audio/mpeg', sizeBytes: Buffer.byteLength(body),
    sha256: sha(body), contentVersion: cv, url: `/api/v1/public/audio/${id}`,
  });
  return {
    poiId: 7, code: 'BEN-DUOC', manifestVersion: version, generatedAt: '', defaultName: 'Bến Dược',
    latitude: 11, longitude: 106, imageUrl: null, imageMimeType: null, updatedAt: '',
    translations: [
      { languageCode: 'en', name: 'Ben Duoc', description: null, narrationText: 'Hello', contentVersion: 1,
        audio: enAudio ? audio(2, enAudio, 1) : null },
      { languageCode: 'vi', name: 'Bến Dược', description: null, narrationText: viText, contentVersion: 1,
        audio: audio(1, 'VI-AUDIO', 1) },
    ],
  };
}

const base = 'http://server';
const server = { [`${base}/api/v1/public/audio/1`]: 'VI-AUDIO', [`${base}/api/v1/public/audio/2`]: 'EN-AUDIO' };

function setup(m: OfflineManifest | (() => OfflineManifest), srv = server) {
  const fs = memoryFs(srv);
  const store = memoryStore();
  let online = true;
  const mgr = createOfflineManager({
    fs, store,
    fetchManifest: async () => {
      if (!online) {
        throw new Error('Network request failed');
      }
      return typeof m === 'function' ? m() : m;
    },
    absoluteUrl: r => `${base}${r}`,
    sleep: async () => undefined,
  });
  return { fs, store, mgr, goOffline: () => { online = false; } };
}

describe('offline manager', () => {
  it('downloads content + audio with checksum verification and serves it offline', async () => {
    const { mgr, goOffline } = setup(manifest('Xin chào', 'EN-AUDIO'));
    const rec = await mgr.downloadPoi(7);
    expect(rec.status).toBe('READY');

    goOffline();
    const vi = await mgr.getOfflineContent(7, 'vi');
    expect(vi?.translation.narrationText).toBe('Xin chào');
    expect(vi?.audio?.status).toBe('READY');
    const en = await mgr.getOfflineContent(7, 'en');
    expect(en?.translation.languageCode).toBe('en');
    expect(en?.audio?.filePath).toContain('/poi-7/en-v1-');
    expect((await mgr.quickVerify(7))?.status).toBe('READY');
  });

  it('retries a corrupted download and succeeds within the attempt limit', async () => {
    const { mgr, fs } = setup(manifest('x', null));
    fs.corruptNext = 2;
    const rec = await mgr.downloadPoi(7);
    expect(rec.status).toBe('READY');
    expect(fs.calls.filter(c => c.endsWith('/audio/1'))).toHaveLength(3);
  });

  it('marks the POI PARTIAL when a file keeps failing integrity checks', async () => {
    const { mgr, fs, store } = setup(manifest('x', 'EN-AUDIO'));
    fs.corruptNext = 3; // first file: all attempts corrupted
    const rec = await mgr.downloadPoi(7);
    expect(rec.status).toBe('PARTIAL');
    const failed = (await store.listAudio(7)).filter(a => a.status === 'FAILED');
    expect(failed).toHaveLength(1);
    expect(failed[0].error).toBe('CHECKSUM_MISMATCH');
    expect([...fs.files.keys()].some(k => k.endsWith('.part'))).toBe(false);
  });

  it('detects files deleted from disk and requires repair', async () => {
    const { mgr, fs } = setup(manifest('x', 'EN-AUDIO'));
    await mgr.downloadPoi(7);
    const enFile = [...fs.files.keys()].find(k => k.includes('/en-'))!;
    fs.files.delete(enFile);
    expect((await mgr.quickVerify(7))?.status).toBe('PARTIAL');
  });

  it('detects updates and removes obsolete audio files after re-download', async () => {
    let current = manifest('x', 'EN-AUDIO', 'v1');
    const srv = { ...server, [`${base}/api/v1/public/audio/3`]: 'EN-AUDIO-2' };
    const { mgr, fs } = setup(() => current, srv);
    await mgr.downloadPoi(7);
    const oldEn = [...fs.files.keys()].find(k => k.includes('/en-'))!;

    const next = manifest('x', 'EN-AUDIO', 'v2');
    next.translations[0] = { ...next.translations[0], contentVersion: 2, narrationText: 'Hello v2',
      audio: { ...next.translations[0].audio!, id: 3, contentVersion: 2, sha256: sha('EN-AUDIO-2'),
        sizeBytes: Buffer.byteLength('EN-AUDIO-2'), url: '/api/v1/public/audio/3' } };
    current = next;
    expect(await mgr.hasUpdate(7)).toBe(true);
    await mgr.downloadPoi(7);
    expect(fs.files.has(oldEn)).toBe(false);
    const en = await mgr.getOfflineContent(7, 'en');
    expect(en?.audio?.contentVersion).toBe(2);
    expect(await mgr.hasUpdate(7)).toBe(false);
  });

  it('deletes all files and metadata', async () => {
    const { mgr, fs, store } = setup(manifest('x', 'EN-AUDIO'));
    await mgr.downloadPoi(7);
    await mgr.deletePoi(7);
    expect(fs.files.size).toBe(0);
    expect(await store.getPoi(7)).toBeNull();
    expect(await mgr.getOfflineContent(7, 'vi')).toBeNull();
  });
});
