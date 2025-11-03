import { useCallback } from "react";
import { buildApiUrl } from "@utils/config";

/* Permite ajustar método, cuerpo, encabezados, formato JSON y query params */
export function useApi() {
  const request = useCallback(async (path, options = {}) => {
    const {
      method = "GET",
      headers = {},
      body,
      useJson = true,
      query,
    } = options;

    const url = buildApiUrl(path, query);

    const finalHeaders = new Headers(headers);
    if (useJson) finalHeaders.set("Content-Type", "application/json");

    const resp = await fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body !== undefined
          ? useJson
            ? JSON.stringify(body)
            : body
          : undefined,
      credentials: "include", // mantiene sesión con cookie stia_session
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

  // atajos REST
  const get = useCallback(
    (path, query) => request(path, { method: "GET", query }),
    [request]
  );
  const post = useCallback(
    (path, body, query) => request(path, { method: "POST", body, query }),
    [request]
  );
  const put = useCallback(
    (path, body, query) => request(path, { method: "PUT", body, query }),
    [request]
  );
  const patch = useCallback(
    (path, body, query) => request(path, { method: "PATCH", body, query }),
    [request]
  );
  const del = useCallback(
    (path, query) => request(path, { method: "DELETE", query }),
    [request]
  );

  return { request, get, post, put, patch, del };
}
