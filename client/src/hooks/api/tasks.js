import React from "react";
import { apiPaths } from "@utils/config";
import { useApi, bulkify } from "@hooks/useApi";

export function useTasksApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.tasks;

  return React.useMemo(
    () => ({
      list: (query) => get(base, query),
      get: ({ id, include } = {}) =>
        get(`${base}/${id}`, include ? { include } : undefined),
      create: (payload) => post(base, bulkify(payload)),
      update: (payload) => put(base, bulkify(payload)),
      remove: (ids) => del(base, { body: { ids } }),
    }),
    [get, post, put, del]
  );
}
