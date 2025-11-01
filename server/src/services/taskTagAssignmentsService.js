import prisma from "#config/prismaClient.js";

const READ_ONLY_FIELDS = ["taskTagAssignmentId", "createdAt"];

/** Elimina campos de solo lectura antes de guardar */
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

/** Construye objeto `include` según el parámetro (task, tag, all) */
const buildInclude = (include) => {
  const wantsAll = include === "all";
  const wantsTask = wantsAll || include?.includes("task");
  const wantsTag = wantsAll || include?.includes("tag");

  const inc = {};
  if (wantsTask) inc.task = true;
  if (wantsTag) inc.tag = true;

  return Object.keys(inc).length ? inc : undefined;
};

/** Construye filtros según taskId y tagId */
const buildWhere = ({ taskId, tagId }) => {
  const where = {};
  if (taskId) where.taskId = String(taskId);
  if (tagId) where.taskTagId = String(tagId);
  return where;
};

/** Listado de asignaciones con filtros, paginación e includes */
export const listAssignments = async (params = {}) => {
  const {
    taskId,
    tagId,
    limit,
    offset,
    include,
    orderBy = { createdAt: "asc" },
  } = params;

  const where = buildWhere({ taskId, tagId });
  const inc = buildInclude(include);
  const { take, skip } = normalizePagination(limit, offset);

  const [items, total] = await Promise.all([
    prisma.taskTagAssignment.findMany({
      where,
      include: inc,
      orderBy,
      take,
      skip,
    }),
    prisma.taskTagAssignment.count({ where }),
  ]);

  return { items, total };
};

/** Obtiene asignación por ID, opcionalmente con relaciones */
export const getAssignmentById = async (id, { include } = {}) => {
  const inc = buildInclude(include);
  const item = await prisma.taskTagAssignment.findUnique({
    where: { taskTagAssignmentId: String(id) },
    include: inc,
  });
  if (!item) {
    const err = new Error(`No encontrado id=${id}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

/** Crea una o varias asignaciones de etiquetas a tareas */
export const createAssignments = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map((r) => stripReadOnly(r));

  try {
    const ops = sanitized.map((data) =>
      prisma.taskTagAssignment.create({ data })
    );
    const items = await prisma.$transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error(
        "Violación de clave foránea (FK). Verifica taskId y taskTagId."
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    if (err.code === "P2002") {
      const e = new Error(
        "Duplicado: ya existe esta etiqueta asignada a la tarea (taskId + taskTagId)."
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

/** Elimina una o varias asignaciones por ID */
export const deleteAssignments = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((x) => String(x));

  const deletedIds = [];
  const notFoundIds = [];

  for (const id of idArray) {
    try {
      await prisma.taskTagAssignment.delete({
        where: { taskTagAssignmentId: id },
      });
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") {
        notFoundIds.push(id);
        continue;
      }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds };
};
