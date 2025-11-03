import React from "react";
import { apiPaths } from "@utils/config";
import { useApi, bulkify } from "@hooks/useApi";

export function useTaskTagAssignmentsApi() {
  const { get, post, del } = useApi();
  const base = apiPaths.taskTagAssignments;

  return React.useMemo(
    () => ({
      list: (q) => get(base, q),
      listByTask: ({ taskId, ...rest } = {}) => get(base, { taskId, ...rest }),
      get: ({ id, include } = {}) =>
        get(`${base}/${id}`, include ? { include } : undefined),
      add: (payload) => post(base, bulkify(payload)),
      remove: (ids) => del(base, { body: { ids } }),
    }),
    [get, post, del]
  );
}
