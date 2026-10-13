import type { OfflineManifest } from '../api/types';

export type OfflinePoiStatus = 'DOWNLOADING' | 'READY' | 'PARTIAL' | 'FAILED';

export interface OfflinePoiRecord {
  poiId: number;
  code: string;
  name: string;
  manifestVersion: string;
  manifest: OfflineManifest;
  status: OfflinePoiStatus;
  totalBytes: number;
  imagePath: string | null;
  error: string | null;
  downloadedAt: string;
}

export interface OfflineAudioRecord {
  poiId: number;
  languageCode: string;
  contentVersion: number;
  assetId: number;
  filePath: string;
  sha256: string;
  sizeBytes: number;
  status: 'READY' | 'FAILED';
  error: string | null;
}

/** Persistence port (SQLite in the app, in-memory in tests). */
export interface OfflineStore {
  upsertPoi(rec: OfflinePoiRecord): Promise<void>;
  getPoi(poiId: number): Promise<OfflinePoiRecord | null>;
  listPois(): Promise<OfflinePoiRecord[]>;
  deletePoi(poiId: number): Promise<void>;
  upsertAudio(rec: OfflineAudioRecord): Promise<void>;
  listAudio(poiId: number): Promise<OfflineAudioRecord[]>;
  deleteAudio(poiId: number, languageCode: string): Promise<void>;
}

/** Filesystem port (react-native-fs in the app, fake in tests). */
export interface FileSystemPort {
  rootDir: string;
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  unlink(path: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
  size(path: string): Promise<number>;
  sha256(path: string): Promise<string>;
  download(url: string, toFile: string): Promise<{ statusCode: number; bytesWritten: number }>;
  listDir(path: string): Promise<string[]>;
}
