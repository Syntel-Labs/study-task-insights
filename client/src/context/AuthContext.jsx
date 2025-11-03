import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildGateUrl, healthUrl } from "@utils/config";

const AuthContext = createContext(null);

// revisa si la cookie de sesión del backend está presente
function hasSessionCookie() {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("stia_session="));
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // valida que el backend responda y que la cookie siga activa
  const refreshSession = useCallback(async () => {
    try {
      await fetch(healthUrl, { credentials: "include" });
      setIsAuthenticated(hasSessionCookie());
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // login usando el endpoint del gateway
  const login = useCallback(async (secret) => {
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

    setIsAuthenticated(true);
    return true;
  }, []);

  // logout directo, sin importar la respuesta del servidor
  const logout = useCallback(async () => {
    try {
      await fetch(buildGateUrl("logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
    }
  }, []);

  // al montar el provider, valida si ya hay sesión activa
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout, refreshSession }),
    [isAuthenticated, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook para acceder al contexto desde componentes
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
