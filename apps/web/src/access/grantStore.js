/**
 * UC02 client state kept on this device only:
 *  - deviceId: random id generated once; the backend binds the grant to its hash, so the grant cannot be
 *    reused from another device (the spec forbids moving a grant between devices).
 *  - grant: { accessToken, expiresAt, packageCode } returned by POST /public/access/redeem.
 * localStorage can be blocked (private mode, disabled site data): every access is guarded, and a
 * missing store simply means "not activated" — the backend stays the source of truth.
 */

const DEVICE_KEY = 'tm.deviceId';
const GRANT_KEY = 'tm.grant';

let memoryDeviceId = null;
let memoryGrant = null;

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId() {
  if (memoryDeviceId) return memoryDeviceId;
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored && /^[A-Za-z0-9_-]{16,128}$/.test(stored)) {
      memoryDeviceId = stored;
      return stored;
    }
  } catch {
    /* fall through to a session-only id */
  }
  memoryDeviceId = randomId();
  try {
    localStorage.setItem(DEVICE_KEY, memoryDeviceId);
  } catch {
    /* the grant then only lives for this tab session */
  }
  return memoryDeviceId;
}

export function loadGrant() {
  if (memoryGrant) return memoryGrant;
  try {
    const raw = localStorage.getItem(GRANT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    memoryGrant = parsed?.accessToken && parsed?.expiresAt ? parsed : null;
  } catch {
    memoryGrant = null;
  }
  return memoryGrant;
}

export function saveGrant(grant) {
  memoryGrant = { accessToken: grant.accessToken, expiresAt: grant.expiresAt, packageCode: grant.packageCode };
  try {
    localStorage.setItem(GRANT_KEY, JSON.stringify(memoryGrant));
  } catch {
    /* kept in memory for this session */
  }
}

export function clearGrant() {
  memoryGrant = null;
  try {
    localStorage.removeItem(GRANT_KEY);
  } catch {
    /* nothing stored */
  }
}

/** Test helper: forget the in-memory copies so the next read goes back to localStorage. */
export function resetGrantStoreForTests() {
  memoryDeviceId = null;
  memoryGrant = null;
}
