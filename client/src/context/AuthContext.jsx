import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildApiUrl, session as sessionCfg } from "@utils/config";
import { useGateApi } from "@hooks/api";

const AuthContext = createContext(null);

/** proveedor de autenticación */
export function AuthProvider({ children }) {
  const { login: gateLogin, logout: gateLogout } = useGateApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const softTimerRef = useRef(null);
  const hardTimerRef = useRef(null);

  function clearTimers() {
    if (softTimerRef.current) {
      clearTimeout(softTimerRef.current);
      softTimerRef.current = null;
    }
    if (hardTimerRef.current) {
      clearTimeout(hardTimerRef.current);
      hardTimerRef.current = null;
    }
  }

  function scheduleSessionTimers() {
    clearTimers();
    softTimerRef.current = setTimeout(
      () => refreshSession({ silent: true }),
      sessionCfg.softTimeout
    );
    hardTimerRef.current = setTimeout(() => logout(), sessionCfg.hardTimeout);
  }

  const refreshSession = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    try {
      const url = buildApiUrl("weekly-productivity", { limit: 1 });
      const resp = await fetch(url, { credentials: "include" });
      const ok = resp.ok;
      setIsAuthenticated((prev) => (prev !== ok ? ok : prev));
      if (ok) scheduleSessionTimers();
      else clearTimers();
    } catch {
      setIsAuthenticated(false);
      clearTimers();
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (secret) => {
      await gateLogin({ secret });
      setIsAuthenticated(true);
      scheduleSessionTimers();
      refreshSession({ silent: true }).catch(() => {});
      return true;
    },
    [gateLogin, refreshSession]
  );

  const logout = useCallback(async () => {
    try {
      await gateLogout();
    } finally {
      setIsAuthenticated(false);
      clearTimers();
    }
  }, [gateLogout]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function onUnauthorized() {
      setIsAuthenticated(false);
      clearTimers();
    }
    window.addEventListener("stia:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("stia:unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    function onFocus() {
      refreshSession({ silent: true }).catch(() => {});
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") onFocus();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout, refreshSession }),
    [isAuthenticated, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
