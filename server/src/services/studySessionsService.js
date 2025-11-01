import prisma from "#config/prismaClient.js";

const READ_ONLY_FIELDS = ["studySessionId", "createdAt", "durationMinutes"];

/** Elimina campos de solo lectura antes de guardar o actualizar */
const stripReadOnly = (data) => {
  const d = { ...data };
  for (const k of READ_ONLY_FIELDS) delete d[k];
  return d;
};

/** Normaliza límite y offset para paginación */
const normalizePagination = (limit, offset) => {
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;
  return { take, skip };
};

/** Valida que endedAt sea igual o posterior a startedAt */
const ensureValidTimes = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) {
    const e = new Error("startedAt y endedAt son obligatorios");
    e.statusCode = 400;
    throw e;
  }
  const s = new Date(startedAt);
  const en = new Date(endedAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
    const e = new Error("Fechas inválidas en startedAt/endedAt");
    e.statusCode = 400;
    throw e;
  }
  if (en < s) {
    const e = new Error("endedAt debe ser mayor o igual que startedAt");
    e.statusCode = 400;
    throw e;
  }
};

/** Incluye relaciones dinámicamente */
const buildInclude = (include) => {
  const inc = {};
  if (include === "task" || include === "all" || include?.includes?.("task")) {
    inc.task = true;
  }
  return Object.keys(inc).length ? inc : undefined;
};

/** Construye filtros de búsqueda */
const buildWhere = ({
  taskId,
  startedFrom,
  startedTo,
  endedFrom,
  endedTo,
  q,
}) => {
  const where = {};
  if (taskId) where.taskId = String(taskId);

  if (startedFrom || startedTo) {
    where.startedAt = {};
    if (startedFrom) where.startedAt.gte = new Date(startedFrom);
    if (startedTo) where.startedAt.lte = new Date(startedTo);
  }
  if (endedFrom || endedTo) {
    where.endedAt = {};
    if (endedFrom) where.endedAt.gte = new Date(endedFrom);
    if (endedTo) where.endedAt.lte = new Date(endedTo);
  }
  if (q) {
    where.notes = { contains: q, mode: "insensitive" };
  }
  return where;
};

/** Listado de sesiones con filtros y paginación */
export const listSessions = async (params = {}) => {
  const {
    taskId,
    startedFrom,
    startedTo,
    endedFrom,
    endedTo,
    q,
    limit,
    offset,
    include,
    orderBy = { startedAt: "asc" },
  } = params;

  const where = buildWhere({
    taskId,
    startedFrom,
    startedTo,
    endedFrom,
    endedTo,
    q,
  });
  const inc = buildInclude(include);
  const { take, skip } = normalizePagination(limit, offset);

  const [items, total] = await Promise.all([
    prisma.studySession.findMany({ where, include: inc, orderBy, take, skip }),
    prisma.studySession.count({ where }),
  ]);

  return { items, total };
};

/** Obtiene una sesión por ID con relaciones */
export const getSessionById = async (id, { include } = {}) => {
  const inc = buildInclude(include);
  const item = await prisma.studySession.findUnique({
    where: { studySessionId: String(id) },
    include: inc,
  });
  if (!item) {
    const err = new Error(`No encontrado id=${id}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

/** Crea una o varias sesiones */
export const createSessions = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map((r) => {
    ensureValidTimes(r.startedAt, r.endedAt);
    return stripReadOnly(r);
  });

  try {
    const ops = sanitized.map((data) => prisma.studySession.create({ data }));
    const items = await prisma.$transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error(
        "Violación de clave foránea (FK). Verifica taskId de la sesión."
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

/** Actualiza una o varias sesiones, requiere studySessionId */
export const updateSessions = async (payload) => {
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
    const id = String(data.studySessionId || "");
    if (!id) {
      const e = new Error("Falta studySessionId en update");
      e.statusCode = 400;
      throw e;
    }

    if (data.startedAt || data.endedAt) {
      const current = await prisma.studySession.findUnique({
        where: { studySessionId: id },
        select: { startedAt: true, endedAt: true },
      });
      if (!current) {
        notFoundIds.push(id);
        continue;
      }
      const s = data.startedAt ?? current.startedAt;
      const en = data.endedAt ?? current.endedAt;
      ensureValidTimes(s, en);
    }

    const updateData = stripReadOnly({ ...data });
    delete updateData.studySessionId;

    try {
      const updated = await prisma.studySession.update({
        where: { studySessionId: id },
        data: updateData,
      });
      items.push(updated);
    } catch (err) {
      if (err.code === "P2025") {
        notFoundIds.push(id);
        continue;
      }
      if (err.code === "P2003") {
        conflictIds.push({
          id,
          message: "Violación de clave foránea (FK). Verifica taskId.",
          target: err.meta?.target,
        });
        continue;
      }
      throw err;
    }
  }

  return { count: items.length, items, notFoundIds, conflictIds };
};

/** Elimina una o varias sesiones por ID */
export const deleteSessions = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map(String);

  const deletedIds = [];
  const notFoundIds = [];

  for (const id of idArray) {
    try {
      await prisma.studySession.delete({ where: { studySessionId: id } });
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
