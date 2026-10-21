import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../api/client.js';
import { authApi } from '../api/endpoints.js';
import { clearSession, loadSession, saveSession } from './session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  const dropSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // A 401 from any request drops the local session and returns the UI to the login screen.
  useEffect(() => setUnauthorizedHandler(dropSession), [dropSession]);

  // Expire locally at the server-given time
  useEffect(() => {
    if (!session) return undefined;
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    const t = setTimeout(dropSession, Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session, dropSession]);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    const s = { accessToken: res.accessToken, expiresAt: res.expiresAt, account: res.account };
    saveSession(s);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revokes the token server-side
    } catch {
      /* even if the server is unreachable, drop the local session */
    } finally {
      dropSession();
    }
  }, [dropSession]);

  const value = useMemo(
    () => ({ session, account: session?.account ?? null, isAuthenticated: !!session, login, logout }),
    [session, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
