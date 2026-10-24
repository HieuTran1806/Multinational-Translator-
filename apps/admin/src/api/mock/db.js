import { SEED_POIS, daysAgo } from './fixtures.js';

/**
 * In-memory "database" for the mock API, persisted to localStorage so a page reload keeps your edits.
 * Uploaded file contents (images/audio) live only in memory; after a reload they fall back to placeholders.
 * Reset: run `localStorage.removeItem('tm_mock_db')` in the browser console, or open any page with ?mockReset.
 */
const KEY = 'tm_mock_db';

const SAMPLE_RATE = 8000;
const SECONDS = 1.5;
export const TONE_SIZE = 44 + SAMPLE_RATE * SECONDS * 2;

function seed() {
  const db = { seq: 1, pois: [], audios: [], jobs: [] };
  const nextId = () => db.seq++;
  for (const s of SEED_POIS) {
    const id = nextId();
    const { images, audio, ...rest } = s;
    db.pois.push({
      ...rest,
      id,
      deleted: false,
      publishedAt: s.status === 'PUBLISHED' ? daysAgo(5) : null,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(id % 7),
      rowVersion: 0,
      images: Array.from({ length: images }, (_, i) => ({ id: nextId(), mimeType: 'image/svg+xml', sortOrder: i })),
      translations: s.translations.map((t) => ({ ...t })),
    });
    for (const [languageCode, source] of Object.entries(audio)) {
      const t = s.translations.find((x) => x.languageCode === languageCode);
      db.audios.push(newAudio(nextId(), id, languageCode, t.contentVersion, source, 'wav', TONE_SIZE));
    }
  }
  return db;
}

export function newAudio(id, poiId, languageCode, contentVersion, source, format, sizeBytes) {
  return {
    id,
    poiId,
    languageCode,
    contentVersion,
    source,
    format,
    mimeType: format === 'mp3' ? 'audio/mpeg' : `audio/${format}`,
    sizeBytes,
    sha256: Math.random().toString(16).slice(2).padEnd(64, '0'),
    status: 'READY',
    createdAt: new Date().toISOString(),
  };
}

function load() {
  try {
    if (new URLSearchParams(window.location.search).has('mockReset')) localStorage.removeItem(KEY);
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable or corrupt: start from seed */
  }
  return seed();
}

export const db = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export const nextId = () => db.seq++;

// ---------- Media (file bytes) ----------

/** Blobs uploaded during this session, keyed by image/audio id. */
const blobs = new Map();

export function saveBlob(id, blob) {
  blobs.set(id, blob);
}

export function imageBlob(id, label) {
  if (blobs.has(id)) return blobs.get(id);
  const hue = (id * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">
    <rect width="100%" height="100%" fill="hsl(${hue} 35% 55%)"/>
    <text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="32" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)} · #${id}</text>
  </svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

export function audioBlob(id) {
  return blobs.get(id) ?? toneWav(330 + (id % 5) * 110);
}

/** A short sine-wave WAV so "Nghe thử" actually plays something. */
function toneWav(freq) {
  const samples = SAMPLE_RATE * SECONDS;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const fade = Math.min(1, i / 400, (samples - i) / 400);
    v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * 12000 * fade, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

function escapeXml(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
}
