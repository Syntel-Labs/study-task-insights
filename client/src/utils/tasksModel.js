// Construye índices por id para búsquedas rápidas
export function buildCatalogIndex({
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],
} = {}) {
  const byId = (arr, key) => Object.fromEntries(arr.map((x) => [x[key], x]));
  return {
    statusById: byId(statuses, "taskStatusId"),
    priorityById: byId(priorities, "taskPriorityId"),
    typeById: byId(types, "taskTypeId"),
    termById: byId(terms, "termId"),
    tagById: byId(tags, "taskTagId"),
  };
}

// Normaliza una tarea a un shape consistente
export function normalizeTask(raw, idx) {
  const id = raw.taskId ?? raw.task_id;
  const statusId =
    raw.taskStatusId ?? raw.task_status_id ?? raw.task_status?.taskStatusId;
  const priorityId =
    raw.taskPriorityId ??
    raw.task_priority_id ??
    raw.task_priority?.taskPriorityId;
  const typeId =
    raw.taskTypeId ?? raw.task_type_id ?? raw.task_type?.taskTypeId;
  const termId =
    raw.termId ??
    raw.term_id ??
    raw.term?.termId ??
    raw.term_obj?.termId ??
    null;
  const dueAt = raw.dueAt ?? raw.due_at ?? null;
  const estimatedMin = raw.estimatedMin ?? raw.estimated_min ?? 0;
  const actualMin = raw.actualMin ?? raw.actual_min ?? null;
  const completedAt = raw.completedAt ?? raw.completed_at ?? null;
  const archivedAt = raw.archivedAt ?? raw.archived_at ?? null;

  const tagObjs = (raw.task_tags ?? raw.tags ?? [])
    .map((t) => (typeof t === "object" ? t : idx?.tagById?.[t] ?? null))
    .filter(Boolean);
  const tagIds = tagObjs.map((t) => t.taskTagId);

  return {
    id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    statusId,
    status: idx?.statusById?.[statusId] ?? null,
    priorityId,
    priority: idx?.priorityById?.[priorityId] ?? null,
    typeId,
    type: idx?.typeById?.[typeId] ?? null,
    termId,
    term: idx?.termById?.[termId] ?? null,
    dueAt,
    estimatedMin,
    actualMin,
    completedAt,
    archivedAt,
    tagIds,
    tags: tagObjs,
  };
}

// Normaliza una lista de tareas
export function normalizeTasks(list = [], idx) {
  return list.map((t) => normalizeTask(t, idx));
}

// Convierte filtros de UI a query para el API
export function filtersToQuery(f, idx) {
  return {
    q: f.q?.trim() || undefined,
    taskStatusId: f.statusId || undefined,
    taskPriorityId: f.priorityId || undefined,
    taskTypeId: f.typeId || undefined,
    termId: f.termId || undefined,
    tagIds: f.tagIds && f.tagIds.length ? f.tagIds.join(",") : undefined,
    dueFrom: f.dueFromISO || undefined,
    dueTo: f.dueToISO || undefined,
    archived: typeof f.archived === "boolean" ? String(f.archived) : undefined,
    orderBy: f.orderBy || undefined,
    orderDir: f.orderDir || undefined,
    limit: f.limit || undefined,
    offset: f.offset || undefined,
  };
}
