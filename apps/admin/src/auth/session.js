/**
 * Token storage. The bearer token is kept in sessionStorage (scoped to this tab, cleared when it closes)
 * plus an in-memory copy. It is never put in a URL or localStorage. Trade-off: any XSS on this origin could
 * read it, so the admin app renders no untrusted HTML and the backend token has a short absolute lifetime.
 */
const KEY = 'tm_admin_session';

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.accessToken || !s?.expiresAt || new Date(s.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
