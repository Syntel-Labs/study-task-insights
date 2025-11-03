import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildGateUrl,
  buildApiUrl,
  session as sessionCfg,
} from "@utils/config";

const AuthContext = createContext(null);

/**
 * provee el contexto de autenticación para toda la app
 * maneja sesión, login, logout y revalidación automática
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // timers para revalidar y cortar sesión
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

  // programa los timers según la duración configurada de sesión
  function scheduleSessionTimers() {
    clearTimers();

    const totalMs = sessionCfg.hours * 60 * 60 * 1000;
    const softMs = Math.max(10_000, totalMs - sessionCfg.revalidateMs);

    // revalidación un poco antes de expirar
    softTimerRef.current = setTimeout(() => {
      refreshSession().catch(() => {});
    }, softMs);

    // corte duro al expirar
    hardTimerRef.current = setTimeout(() => {
      setIsAuthenticated(false);
      clearTimers();
    }, totalMs);
  }

  // verifica la validez de la sesión contra un endpoint protegido
  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildApiUrl("weekly-productivity", { limit: 1 });
      const resp = await fetch(url, { credentials: "include" });

      const ok = resp.ok;
      setIsAuthenticated(ok);

      if (ok) scheduleSessionTimers();
      else clearTimers();
    } catch {
      setIsAuthenticated(false);
      clearTimers();
    } finally {
      setLoading(false);
    }
  }, []);

  // proceso de login con el gateway
  const login = useCallback(
    async (secret) => {
      const resp = await fetch(buildGateUrl("login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const err = new Error(data.message || `HTTP ${resp.status}`);
        err.status = resp.status;
        err.payload = data;
        throw err;
      }

      // se asume autenticación y se preparan timers
      setIsAuthenticated(true);
      scheduleSessionTimers();

      // revalida sin bloquear UI
      refreshSession().catch(() => {});
      return true;
    },
    [refreshSession]
  );

  // cierra sesión y limpia timers
  const logout = useCallback(async () => {
    try {
      await fetch(buildGateUrl("logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      clearTimers();
    }
  }, []);

  // al montar, se valida el estado actual de sesión
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // escucha global para invalidar sesión al recibir 401/403
  useEffect(() => {
    function onUnauthorized() {
      setIsAuthenticated(false);
      clearTimers();
    }
    window.addEventListener("stia:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("stia:unauthorized", onUnauthorized);
  }, []);

  // revalida al recuperar foco o visibilidad
  useEffect(() => {
    function onFocus() {
      refreshSession().catch(() => {});
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

/* hook para acceder al contexto de autenticación */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
