import { useCallback } from "react";
import { buildApiUrl } from "@utils/config";

export function bulkify(input) {
  return Array.isArray(input) ? input : [input];
}

export function useApi() {
  const DEBUG_API = false;

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
    if (useJson && body !== undefined)
      finalHeaders.set("Content-Type", "application/json");

    // request
    const startedAt = performance.now();
    if (DEBUG_API) {
      const safeHeaders = {};
      finalHeaders.forEach((v, k) => (safeHeaders[k] = v));
      console.log("[API] >>>", {
        method,
        url,
        headers: safeHeaders,
        body: useJson && body !== undefined ? body : "(raw body)",
      });
    }

    let resp;
    try {
      resp = await fetch(url, {
        method,
        headers: finalHeaders,
        body:
          body !== undefined
            ? useJson
              ? JSON.stringify(body)
              : body
            : undefined,
        credentials: "include",
      });
    } catch (networkErr) {
      if (DEBUG_API) {
        console.error("[API] NETWORK ERROR <<<", {
          method,
          url,
          error: networkErr,
        });
      }
      throw networkErr;
    }

    const elapsed = (performance.now() - startedAt).toFixed(1);

    if (resp.status === 401 || resp.status === 403) {
      window.dispatchEvent(new CustomEvent("stia:unauthorized"));
    }

    // clon para poder leer texto “raw” además del parseo
    const clone = resp.clone();
    const contentType = resp.headers.get("content-type") || "";
    let rawText = "";
    try {
      rawText = await clone.text();
    } catch {
      rawText = "";
    }

    let data;
    try {
      data = contentType.includes("application/json")
        ? await resp.json()
        : rawText;
    } catch (parseErr) {
      // si falló el parseo json obtener raw
      data = rawText;
    }

    // response
    if (DEBUG_API) {
      console.log("[API] <<<", {
        method,
        url,
        status: resp.status,
        ok: resp.ok,
        contentType,
        elapsedMs: Number(elapsed),

        data: contentType.includes("application/json")
          ? data
          : (rawText || "").slice(0, 800),
      });
    }

    if (!resp.ok) {
      const err = new Error((data && data.message) || `HTTP ${resp.status}`);
      err.status = resp.status;
      err.payload = data;
      throw err;
    }

    return data;
  }, []);

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
    (path, options = {}) => request(path, { method: "DELETE", ...options }),
    [request]
  );

  return { request, get, post, put, patch, del };
}
