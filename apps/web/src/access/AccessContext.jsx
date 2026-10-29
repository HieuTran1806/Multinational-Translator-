import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { accessApi, usageApi } from '../api/endpoints.js';
import { setAccessLostHandler } from '../api/client.js';
import { clearGrant, getDeviceId, loadGrant, saveGrant } from './grantStore.js';

/**
 * UC02 access state for the whole app.
 *  status: 'checking'   – a stored grant is being verified with GET /access/me (A1: reopen on same device)
 *          'active'     – valid grant; User features are available until `expiresAt`
 *          'none'       – no grant (never activated, expired or revoked); `reason` says which
 *          'unverified' – a stored grant exists but the backend cannot be reached (E5): no access is
 *                         granted until it is verified, the visitor can retry
 * The backend is the source of truth: the local expiry only avoids pointless calls and ends the session
 * on time; any 401 ACCESS_REQUIRED from the API also ends it (see client.js).
 */
const AccessContext = createContext(null);

const MAX_TIMEOUT = 2_147_483_647; // setTimeout limit (~24.8 days)

function isExpired(grant, now = Date.now()) {
  return !grant || new Date(grant.expiresAt).getTime() <= now;
}

function initialState() {
  const grant = loadGrant();
  if (!grant) return { status: 'none', grant: null, reason: null };
  if (isExpired(grant)) {
    clearGrant();
    return { status: 'none', grant: null, reason: 'expired' };
  }
  return { status: 'checking', grant, reason: null };
}

export function AccessProvider({ children }) {
  const [state, setState] = useState(initialState);
  // One redeem per QR token, even if a page effect runs twice (React StrictMode) or the user double-taps.
  const pendingRedeems = useRef(new Map());

  const endSession = useCallback((reason) => {
    clearGrant();
    setState({ status: 'none', grant: null, reason });
  }, []);

  // A1: verify a grant restored from this device before showing any User feature. Runs whenever the
  // state enters 'checking' (first load, or retry after the backend was unreachable).
  const grantToVerify = state.status === 'checking' ? state.grant : null;
  useEffect(() => {
    if (!grantToVerify) return undefined;
    let cancelled = false;
    accessApi
      .me()
      .then((me) => {
        if (cancelled) return;
        const grant = { ...grantToVerify, expiresAt: me.expiresAt, packageCode: me.packageCode };
        saveGrant(grant);
        setState({ status: 'active', grant, reason: null });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) endSession(isExpired(grantToVerify) ? 'expired' : 'revoked');
        else setState((s) => ({ ...s, status: 'unverified' }));
      });
    return () => {
      cancelled = true;
    };
  }, [grantToVerify, endSession]);

  // End the session exactly when the grant expires, even if the visitor is just listening.
  useEffect(() => {
    if (state.status !== 'active') return undefined;
    const ms = new Date(state.grant.expiresAt).getTime() - Date.now();
    const id = setTimeout(() => endSession('expired'), Math.min(Math.max(ms, 0), MAX_TIMEOUT));
    return () => clearTimeout(id);
  }, [state.status, state.grant, endSession]);

  // Any API call rejected with 401 ACCESS_REQUIRED (revoked, expired, other device) ends the session.
  // Several in-flight requests can fail together: only the first one decides the reason.
  useEffect(() => {
    setAccessLostHandler(() => {
      const grant = loadGrant();
      if (grant) endSession(isExpired(grant) ? 'expired' : 'revoked');
    });
    return () => setAccessLostHandler(() => {});
  }, [endSession]);

  const activate = useCallback((qrToken) => {
    const pending = pendingRedeems.current.get(qrToken);
    if (pending) return pending;
    const promise = accessApi.redeem(qrToken, getDeviceId()).then((grant) => {
      saveGrant(grant);
      setState({ status: 'active', grant: loadGrant(), reason: null });
      try {
        const sid = 'ss_' + (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2));
        sessionStorage.setItem('tm.session_id', sid);
        usageApi.record('session_start', { eventId: sid }).catch(() => {});
      } catch {
        /* ignore storage / analytics error */
      }
      return grant;
    });
    pendingRedeems.current.set(qrToken, promise);
    // A failed attempt may be retried (E5: network); a successful one stays cached for the double effect.
    promise.catch(() => pendingRedeems.current.delete(qrToken));
    return promise;
  }, []);

  const retryVerify = useCallback(() => setState((s) => ({ ...s, status: 'checking' })), []);

  const value = useMemo(
    () => ({ ...state, activate, retryVerify }),
    [state, activate, retryVerify],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used inside <AccessProvider>');
  return ctx;
}
