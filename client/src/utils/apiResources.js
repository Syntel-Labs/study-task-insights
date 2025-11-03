import React from "react";
import { apiPaths } from "@utils/config";
import { useApi } from "@hooks/useApi";

/**
 * API de tareas
 *
 * Funcionalidades:
 * - list(query): obtiene listado de tareas
 * - get({ id, include }): obtiene una tarea por ID, opcionalmente con relaciones
 * - create(payload): crea una nueva tarea
 * - update(arr|obj): actualiza una o varias tareas
 * - remove({ ids }): elimina tareas por IDs
 */
export function useTasksApi() {
  const { get, post, put, del } = useApi();

  return React.useMemo(
    () => ({
      list: (query) => get(apiPaths.tasks, query),
      get: ({ id, include } = {}) =>
        get(`${apiPaths.tasks}/${id}`, include ? { include } : undefined),
      create: (payload) => post(apiPaths.tasks, payload),
      update: (arr) => put(apiPaths.tasks, Array.isArray(arr) ? arr : [arr]),
      remove: ({ ids }) => del(apiPaths.tasks, { ids }),
    }),
    [get, post, put, del]
  );
}

/**
 * API de asignaciones de tags a tareas
 *
 * Funcionalidades:
 * - listByTask({ taskId }): obtiene los tags asignados a una tarea
 * - add({ taskId, taskTagId }): asigna un tag a una tarea
 * - remove({ ids }): elimina asignaciones por IDs
 */
export function useTaskTagAssignmentsApi() {
  const { get, post, del } = useApi();
  return React.useMemo(
    () => ({
      listByTask: ({ taskId }) => get(apiPaths.taskTagAssignments, { taskId }),
      add: ({ taskId, taskTagId }) =>
        post(apiPaths.taskTagAssignments, { taskId, taskTagId }),
      remove: ({ ids }) => del(apiPaths.taskTagAssignments, { ids }),
    }),
    [get, post, del]
  );
}

/**
 * API de sesiones de estudio
 *
 * Funcionalidades:
 * - list(q): obtiene listado de sesiones
 * - create(p): crea una nueva sesión
 * - update(id, p): actualiza sesión por ID
 * - remove(id): elimina sesión por ID
 */
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

/**
 * API de catálogos generales (status, prioridad, tipos, términos, tags)
 *
 * Funcionalidades:
 * - taskStatuses(q)
 * - taskPriorities(q)
 * - taskTypes(q)
 * - terms(q)
 * - taskTags(q)
 *
 * Retorna promesas con la data correspondiente
 */
export function useCatalogsApi() {
  const { get } = useApi();

  return React.useMemo(
    () => ({
      taskStatuses: (q) => get(`${apiPaths.catalogs}/task-statuses`, q),
      taskPriorities: (q) => get(`${apiPaths.catalogs}/task-priorities`, q),
      taskTypes: (q) => get(`${apiPaths.catalogs}/task-types`, q),
      terms: (q) => get(`${apiPaths.catalogs}/terms`, q),
      taskTags: (q) => get(`${apiPaths.catalogs}/task-tags`, q),
    }),
    [get]
  );
}

/**
 * API de productividad semanal
 *
 * Funcionalidades:
 * - list(q): obtiene productividad semanal
 * - refresh(q): recalcula/actualiza productividad semanal
 */
export function useProductivityApi() {
  const { get, post } = useApi();
  const base = apiPaths.weeklyProductivity;

  return {
    list: (q) => get(base, q),
    refresh: (q) => post(`${base}/refresh`, q ?? {}),
  };
}

/**
 * API de importaciones por lote
 *
 * Funcionalidades:
 * - batch(payload): importa múltiples elementos en batch
 */
export function useImportApi() {
  const { post } = useApi();
  return { batch: (payload) => post(apiPaths.importBatch, payload) };
}

/**
 * API para interacción con un modelo LLM
 *
 * Funcionalidades:
 * - recommendations(q): obtiene recomendaciones de LLM
 * - chat(messages): envía mensajes y recibe respuestas
 */
export function useLlmApi() {
  const { get, post } = useApi();
  const base = apiPaths.llm;

  return {
    recommendations: (q) => get(`${base}/recommendations`, q),
    chat: (messages) => post(`${base}/chat`, { messages }),
  };
}
