import React from "react";
import { apiPaths } from "@utils/config";
import { useApi, bulkify } from "@hooks/useApi";

/** api para sesiones de estudio */
export function useStudySessionsApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.studySessions;

  return React.useMemo(
    () => ({
      list: (q) => get(base, q),
      get: ({ id, include } = {}) =>
        get(`${base}/${id}`, include ? { include } : undefined),
      create: (payload) => post(base, bulkify(payload)),
      update: (payload) => put(base, bulkify(payload)),
      remove: (ids) => del(base, { body: { ids } }),
    }),
    [get, post, put, del, base]
  );
}
