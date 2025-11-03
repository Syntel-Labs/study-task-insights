import React from "react";
import { apiPaths } from "@utils/config";
import { useApi, bulkify } from "@hooks/useApi";

/**
 * Factory genérica para CRUD de catálogos: /api/catalogs/:entity
 */
function useCatalogEntity(entityPath) {
  const { get, post, put, del } = useApi();
  const base = `${apiPaths.catalogs}/${entityPath}`;

  return React.useMemo(
    () => ({
      list: (query) => get(base, query),
      getById: ({ id }) => get(`${base}/${id}`),
      create: (payload) => post(base, bulkify(payload)),
      update: (payload) => put(base, bulkify(payload)),
      remove: (ids) => del(base, { body: { ids } }), // DELETE con body
    }),
    [get, post, put, del, base]
  );
}

/** Hooks específicos por catálogo */
export function useTermsApi() {
  return useCatalogEntity("terms");
}

export function useTaskStatusesApi() {
  return useCatalogEntity("task-statuses");
}

export function useTaskPrioritiesApi() {
  return useCatalogEntity("task-priorities");
}

export function useTaskTypesApi() {
  return useCatalogEntity("task-types");
}

export function useTaskTagsApi() {
  return useCatalogEntity("task-tags");
}

/** Helper para agrupar todos los hooks de catálogos */
export function useCatalogsCrud() {
  return {
    terms: useTermsApi(),
    taskStatuses: useTaskStatusesApi(),
    taskPriorities: useTaskPrioritiesApi(),
    taskTypes: useTaskTypesApi(),
    taskTags: useTaskTagsApi(),
  };
}
