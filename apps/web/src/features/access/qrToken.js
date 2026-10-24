const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,200}$/;

/**
 * Reads the QR token out of what was scanned or typed (UC02 step 2 + A2): either the activation URL the
 * backend encodes into each QR (`…/activate?t=<token>`) or the bare token printed on a ticket.
 * Returns null when nothing usable is found. The token itself is only validated by the backend.
 */
export function extractQrToken(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const token = new URL(value).searchParams.get('t');
      return token && TOKEN_PATTERN.test(token) ? token : null;
    } catch {
      return null;
    }
  }
  return TOKEN_PATTERN.test(value) ? value : null;
}
