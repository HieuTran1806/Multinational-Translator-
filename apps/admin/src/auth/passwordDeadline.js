/**
 * Demo-only client-side deadline. The API does not expose a password-changed date
 * or an endpoint for admins to change their own password.
 * Never store credentials here; clearing browser storage bypasses this UI check.
 */
const PREFIX = 'tm_admin_password_deadline_';
export const PASSWORD_CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000;

function key(account) {
  return `${PREFIX}${account?.id ?? account?.username}`;
}

export function getPasswordDeadline(account) {
  if (account?.role !== 'ADMIN') return null;
  try {
    const storageKey = key(account);
    const stored = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(stored) && stored > 0) return stored;
    const deadline = Date.now() + PASSWORD_CHANGE_WINDOW_MS;
    localStorage.setItem(storageKey, String(deadline));
    return deadline;
  } catch {
    // UI-only demo: cannot persist the deadline when storage is unavailable.
    return Date.now() + PASSWORD_CHANGE_WINDOW_MS;
  }
}

export function isPasswordChangeOverdue(account) {
  const deadline = getPasswordDeadline(account);
  return deadline !== null && Date.now() >= deadline;
}
