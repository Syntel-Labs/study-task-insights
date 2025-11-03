import { useCallback } from "react";
import { healthUrl } from "@utils/config";

/** Hook para chequear estado de /health */
export function useHealthApi() {
  // check de salud, devuelve JSON o texto según content-type
  const check = useCallback(async () => {
    const resp = await fetch(healthUrl, { credentials: "include" });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const contentType = resp.headers.get("content-type") || "";
    return contentType.includes("application/json") ? resp.json() : resp.text();
  }, []);

  return { check };
}
