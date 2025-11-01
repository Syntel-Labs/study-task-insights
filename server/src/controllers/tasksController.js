import {
  listTasks,
  getTaskById,
  createTasks,
  updateTasks,
  deleteTasks,
} from "#services/tasksService.js";

/** Devuelve listado de tareas con filtros, paginación e include */
export const getList = async (req, res, next) => {
  try {
    const {
      q,
      statusId,
      priorityId,
      typeId,
      termId,
      tagId,
      dueFrom,
      dueTo,
      archived,
      include,
      limit,
      offset,
      orderByField,
      orderByDir,
    } = req.query;

    const orderBy =
      orderByField && orderByDir
        ? { [orderByField]: orderByDir === "desc" ? "desc" : "asc" }
        : { dueAt: "asc" };

    const result = await listTasks({
      q: q?.toString(),
      statusId,
      priorityId,
      typeId,
      termId,
      tagId,
      dueFrom,
      dueTo,
      archived,
      include: include?.toString(),
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      orderBy,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Obtiene una tarea por su ID */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getTaskById(id, { include: include?.toString() });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/** Crea una o varias tareas nuevas */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }
    const result = await createTasks(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/** Actualiza una o varias tareas existentes; cada objeto debe incluir taskId */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }
    const result = await updateTasks(payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Elimina una o varias tareas; requiere body.ids */
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
    const result = await deleteTasks(ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
