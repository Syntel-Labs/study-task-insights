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

    const contentType = resp.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await resp.json()
      : await resp.text();

    if (!resp.ok) {
      const err = new Error((data && data.message) || `HTTP ${resp.status}`);
      err.status = resp.status;
      err.payload = data;
      throw err;
    }

    return data;
  }, []);

  // logout, invalida sesión
  const logout = useCallback(async () => {
    const resp = await fetch(buildGateUrl("logout"), {
      method: "POST",
      credentials: "include",
    });

    const contentType = resp.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await resp.json()
      : await resp.text();

    if (!resp.ok) {
      const err = new Error((data && data.message) || `HTTP ${resp.status}`);
      err.status = resp.status;
      err.payload = data;
      throw err;
    }

    return data;
  }, []);

  return { login, logout };
}
