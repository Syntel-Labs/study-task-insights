import { apiPaths } from "@utils/config";
import { useApi } from "@hooks/useApi";

/** api de tareas */
export function useTasksApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.tasks;

  return {
    list: (query) => get(base, query),
    getById: (id) => get(`${base}/${id}`),
    create: (payload) => post(base, payload),
    update: (id, payload) => put(`${base}/${id}`, payload),
    remove: (id) => del(`${base}/${id}`),
  };
}

/** api de sesiones de estudio */
export function useSessionsApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.studySessions;

  return {
    list: (q) => get(base, q),
    create: (p) => post(base, p),
    update: (id, p) => put(`${base}/${id}`, p),
    remove: (id) => del(`${base}/${id}`),
  };
}

/** api de catálogos generales (términos, tipos, tags, etc.) */
export function useCatalogsApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.catalogs;

  return {
    list: (entity, q) => get(`${base}/${entity}`, q),
    create: (entity, p) => post(`${base}/${entity}`, p),
    update: (entity, id, p) => put(`${base}/${entity}/${id}`, p),
    remove: (entity, id) => del(`${base}/${entity}/${id}`),
  };
}

/** api de productividad semanal */
export function useProductivityApi() {
  const { get, post } = useApi();
  const base = apiPaths.weeklyProductivity;

  return {
    list: (q) => get(base, q),
    refresh: (q) => post(`${base}/refresh`, q ?? {}),
  };
}

/** api para importaciones por lote */
export function useImportApi() {
  const { post } = useApi();

  return {
    batch: (payload) => post(apiPaths.importBatch, payload),
  };
}

/** api de interacción con el modelo LLM */
export function useLlmApi() {
  const { get, post } = useApi();
  const base = apiPaths.llm;

  return {
    recommendations: (q) => get(`${base}/recommendations`, q),
    chat: (messages) => post(`${base}/chat`, { messages }),
  };
}
