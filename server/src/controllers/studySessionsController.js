import {
  listSessions,
  getSessionById,
  createSessions,
  updateSessions,
  deleteSessions,
} from "#services/studySessionsService.js";

/** Listado de sesiones con filtros y paginación */
export const getList = async (req, res, next) => {
  try {
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
      orderByField,
      orderByDir,
    } = req.query;

    const orderBy =
      orderByField && orderByDir
        ? { [orderByField]: orderByDir === "desc" ? "desc" : "asc" }
        : { startedAt: "asc" };

    const result = await listSessions({
      taskId,
      startedFrom,
      startedTo,
      endedFrom,
      endedTo,
      q: q?.toString(),
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      include: include?.toString(),
      orderBy,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Obtiene una sesión por ID, opcionalmente con relaciones */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getSessionById(id, { include: include?.toString() });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/** Crea una o varias sesiones */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }
    const result = await createSessions(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/** Actualiza una o varias sesiones */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }
    const result = await updateSessions(payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Elimina una o varias sesiones por body.ids */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    if (req.query.ids) {
      const e = new Error(
        "Usa body: { ids: [...] } (query 'ids' no permitido)"
      );
      e.statusCode = 400;
      throw e;
    }
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      const e = new Error("Body inválido: se requiere { ids: [...] }");
      e.statusCode = 400;
      throw e;
    }
    const result = await deleteSessions(ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
