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

/** Proveedor de autenticación */
export function AuthProvider({ children }) {
  const { login: gateLogin, logout: gateLogout } = useGateApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const softTimerRef = useRef(null);
  const hardTimerRef = useRef(null);
  const lastFocusCheckRef = useRef(0);
  const AUTH_FLAG = "stia_auth";

  function hasClientSessionFlag() {
    try {
      return localStorage.getItem(AUTH_FLAG) === "1";
    } catch {
      return false;
    }
  }

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
    const totalMs = Number(sessionCfg.hours) * 60 * 60 * 1000;
    const revalidateMs = Number(sessionCfg.revalidateMs ?? 5 * 60 * 1000);
    const softMs = Math.max(30_000, totalMs - revalidateMs);
    const hardMs = Math.max(60_000, totalMs);

    softTimerRef.current = setTimeout(() => {
      refreshSession({ silent: true }).catch(() => {});
    }, softMs);

    hardTimerRef.current = setTimeout(async () => {
      const ok = await revalidateOnce().catch(() => false);
      if (!ok) await logout();
      else scheduleSessionTimers();
    }, hardMs);
  }

  // Hace 1 ping al endpoint protegido y retorna boolean
  const revalidateOnce = useCallback(async () => {
    const url = buildApiUrl("weekly-productivity", { limit: 1 });
    const resp = await fetch(url, { credentials: "include" });
    return resp.ok;
  }, []);

  const refreshSession = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!hasClientSessionFlag()) return false;
      if (!silent) setLoading(true);
      try {
        const ok = await revalidateOnce();
        setIsAuthenticated((prev) => (prev !== ok ? ok : prev));
        if (ok) scheduleSessionTimers();
        else clearTimers();
      } catch {
        setIsAuthenticated(false);
        clearTimers();
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [revalidateOnce]
  );

  const waitForSession = useCallback(
    async (maxAttempts = 8) => {
      let attempt = 0;
      while (attempt < maxAttempts) {
        const ok = await revalidateOnce().catch(() => false);
        if (ok) return true;
        const delay = Math.min(100 * 2 ** attempt, 1600);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      }
      return false;
    },
    [revalidateOnce]
  );

  const login = useCallback(
    async (secret) => {
      await gateLogin({ secret });
      const ready = await waitForSession();
      if (!ready) {
        const err = new Error("La sesión no se estableció tras el login.");
        err.status = 401;
        throw err;
      }
      try {
        localStorage.setItem(AUTH_FLAG, "1");
      } catch {}
      setIsAuthenticated(true);
      scheduleSessionTimers();
      return true;
    },
    [gateLogin, waitForSession]
  );

  const logout = useCallback(async () => {
    try {
      await gateLogout();
    } finally {
      try {
        localStorage.removeItem(AUTH_FLAG);
      } catch {}
      setIsAuthenticated(false);
      clearTimers();
    }
  }, [gateLogout]);

  useEffect(() => {
    if (hasClientSessionFlag()) {
      refreshSession({ silent: false }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    function onUnauthorized() {
      try {
        localStorage.removeItem(AUTH_FLAG);
      } catch {}
      setIsAuthenticated(false);
      clearTimers();
    }
    window.addEventListener("stia:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("stia:unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    function onFocus() {
      const now = Date.now();
      if (!hasClientSessionFlag()) return;
      if (now - lastFocusCheckRef.current > 30_000) {
        lastFocusCheckRef.current = now;
        refreshSession({ silent: true }).catch(() => {});
      }
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
