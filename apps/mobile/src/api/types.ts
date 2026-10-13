export type AudioSourceKind = 'UPLOAD' | 'TTS';

export interface AudioInfo {
  id: number;
  source: AudioSourceKind;
  format: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentVersion: number;
  url: string; // relative to API base
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface PoiSummary {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  languages: string[];
  updatedAt: string;
}

export interface PoiDetail {
  id: number;
  code: string;
  requestedLanguage: string;
  language: string;
  fallback: boolean;
  availableLanguages: string[];
  name: string;
  description: string | null;
  narrationText: string;
  contentVersion: number;
  audio: AudioInfo | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface OfflineTranslation {
  languageCode: string;
  name: string;
  description: string | null;
  narrationText: string;
  contentVersion: number;
  audio: AudioInfo | null;
}

export interface OfflineManifest {
  poiId: number;
  code: string;
  manifestVersion: string;
  generatedAt: string;
  defaultName: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  imageMimeType: string | null;
  updatedAt: string;
  translations: OfflineTranslation[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}
