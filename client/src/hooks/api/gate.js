import { useCallback } from "react";
import { buildGateUrl } from "@utils/config";

/** Hooks para login/logout contra /gate, mantiene cookie stia_session */
export function useGateApi() {
  // login con secreto, mantiene sesión via cookie
  const login = useCallback(async ({ secret }) => {
    const resp = await fetch(buildGateUrl("login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ secret }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const contentType = resp.headers.get("content-type") || "";
    return contentType.includes("application/json") ? resp.json() : resp.text();
  }, []);

  // logout, invalida sesión
  const logout = useCallback(async () => {
    const resp = await fetch(buildGateUrl("logout"), {
      method: "POST",
      credentials: "include",
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const contentType = resp.headers.get("content-type") || "";
    return contentType.includes("application/json") ? resp.json() : resp.text();
  }, []);

  return { login, logout };
}
