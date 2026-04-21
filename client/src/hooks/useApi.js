import { useCallback } from "react";
import { buildApiUrl } from "@utils/config";

export function bulkify(input) {
  return Array.isArray(input) ? input : [input];
}

export function useApi() {
  const request = useCallback(async (path, options = {}) => {
    const { method = "GET", headers = {}, body, useJson = true, query } = options;

    const url = buildApiUrl(path, query);
    const finalHeaders = new Headers(headers);
    if (useJson && body !== undefined)
      finalHeaders.set("Content-Type", "application/json");

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
      throw networkErr;
    }

    if (resp.status === 401 || resp.status === 403) {
      window.dispatchEvent(new CustomEvent("stia:unauthorized"));
    }

    const clone = resp.clone();
    const contentType = resp.headers.get("content-type") ?? "";
    let rawText = "";
    try {
      rawText = await clone.text();
    } catch {
      rawText = "";
    }

    let data;
    try {
      data = contentType.includes("application/json") ? await resp.json() : rawText;
    } catch {
      data = rawText;
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
    (path, opts = {}) => request(path, { method: "DELETE", ...opts }),
    [request]
  );

  return { request, get, post, put, patch, del };
}
