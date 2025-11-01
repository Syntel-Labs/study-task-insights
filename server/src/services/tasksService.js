import prisma from "#config/prismaClient.js";

const READ_ONLY_FIELDS = ["taskId", "createdAt", "updatedAt"];

/** Elimina campos de solo lectura antes de guardar o actualizar */
const stripReadOnly = (data) => {
  const d = { ...data };
  for (const k of READ_ONLY_FIELDS) delete d[k];
  return d;
};

/** Normaliza límite y desplazamiento para paginación */
const normalizePagination = (limit, offset) => {
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;
  return { take, skip };
};

/** Construye filtros `where` a partir de los parámetros de query */
const buildWhere = (filters = {}) => {
  const {
    statusId,
    priorityId,
    typeId,
    termId,
    tagId,
    dueFrom,
    dueTo,
    q,
    archived,
  } = filters;

  const where = {};

  if (statusId !== undefined) where.taskStatusId = Number(statusId);
  if (priorityId !== undefined) where.taskPriorityId = Number(priorityId);
  if (typeId !== undefined) where.taskTypeId = Number(typeId);
  if (termId !== undefined) where.termId = Number(termId);

  if (archived === undefined) {
    where.archivedAt = null;
  } else if (archived === "true") {
    where.archivedAt = { not: null };
  } else if (archived === "false") {
    where.archivedAt = null;
  }

  if (dueFrom || dueTo) {
    where.dueAt = {};
    if (dueFrom) where.dueAt.gte = new Date(dueFrom);
    if (dueTo) where.dueAt.lte = new Date(dueTo);
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (tagId) {
    where.taskTagAssignments = {
      some: { taskTagId: String(tagId) },
    };
  }

  return where;
};

/** Construye objeto `include` para relaciones según parámetro */
const buildInclude = (include) => {
  const wantsAll = include === "all";
  const wantsLookups = wantsAll || include?.includes("lookups");
  const wantsTags = wantsAll || include?.includes("tags");

  const inc = {};
  if (wantsLookups) {
    inc.taskStatus = true;
    inc.taskPriority = true;
    inc.taskType = true;
    inc.term = true;
  }
  if (wantsTags) {
    inc.taskTagAssignments = {
      include: { taskTag: true },
    };
  }
  return Object.keys(inc).length ? inc : undefined;
};

/** Listado de tareas con filtros, paginación e includes */
export const listTasks = async (params = {}) => {
  const {
    q,
    limit,
    offset,
    statusId,
    priorityId,
    typeId,
    termId,
    tagId,
    dueFrom,
    dueTo,
    archived,
    include,
    orderBy = { dueAt: "asc" },
  } = params;

  const where = buildWhere({
    q,
    statusId,
    priorityId,
    typeId,
    termId,
    tagId,
    dueFrom,
    dueTo,
    archived,
  });

  const inc = buildInclude(include);
  const { take, skip } = normalizePagination(limit, offset);

  const [items, total] = await Promise.all([
    prisma.task.findMany({ where, include: inc, orderBy, take, skip }),
    prisma.task.count({ where }),
  ]);

  return { items, total };
};

/** Obtiene una tarea por UUID y relaciones */
export const getTaskById = async (taskId, { include } = {}) => {
  const inc = buildInclude(include);
  const item = await prisma.task.findUnique({
    where: { taskId: String(taskId) },
    include: inc,
  });
  if (!item) {
    const err = new Error(`No encontrado id=${taskId}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

/** Crea una o varias tareas nuevas */
export const createTasks = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map(stripReadOnly);

  try {
    const ops = sanitized.map((data) => prisma.task.create({ data }));
    const items = await prisma.$transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error(
        "Violación de clave foránea (FK). Verifica catálogos/term."
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    if (err.code === "P2002") {
      const target = err.meta?.target?.join(", ") || "índice único";
      const e = new Error(
        `Duplicado detectado: ya existe una tarea activa con el mismo título y periodo académico (${target}). Si la tarea anterior está completada o archivada, archívala antes de crear una nueva.`
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }

    throw err;
  }
};

/** Actualiza una o varias tareas existentes */
export const updateTasks = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const items = [];
  const notFoundIds = [];
  const conflictIds = [];

  for (const data of records) {
    const rawId = data.taskId;
    if (!rawId) {
      const err = new Error("Falta taskId en update");
      err.statusCode = 400;
      throw err;
    }
    const id = String(rawId);
    const updateData = stripReadOnly({ ...data });
    delete updateData.taskId;

    try {
      const updated = await prisma.task.update({
        where: { taskId: id },
        data: updateData,
      });
      items.push(updated);
    } catch (err) {
      if (err.code === "P2025") {
        notFoundIds.push(id);
        continue;
      }
      if (err.code === "P2002") {
        conflictIds.push({
          id,
          message:
            "Conflicto de unicidad: existe otra tarea activa con el mismo título o fecha dentro del mismo periodo.",
          target: err.meta?.target,
        });
        continue;
      }
      if (err.code === "P2003") {
        conflictIds.push({
          id,
          message: "Violación de clave foránea (FK). Verifica las referencias.",
          target: err.meta?.target,
        });
        continue;
      }

      throw err;
    }
  }

  return { count: items.length, items, notFoundIds, conflictIds };
};

/** Elimina una o varias tareas por id */
export const deleteTasks = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((x) => String(x));

  const deletedIds = [];
  const notFoundIds = [];
  const blockedIds = [];

  for (const id of idArray) {
    try {
      await prisma.task.delete({ where: { taskId: id } });
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") {
        notFoundIds.push(id);
        continue;
      }
      if (err.code === "P2003") {
        blockedIds.push(id);
        continue;
      }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds, blockedIds };
};
