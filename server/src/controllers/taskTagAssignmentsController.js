import {
  listAssignments,
  getAssignmentById,
  createAssignments,
  deleteAssignments,
} from "#services/taskTagAssignmentsService.js";

/** Devuelve listado de asignaciones de etiquetas a tareas con filtros y paginación */
export const getList = async (req, res, next) => {
  try {
    const { taskId, tagId, limit, offset, include, orderByField, orderByDir } =
      req.query;

    const orderBy =
      orderByField && orderByDir
        ? { [orderByField]: orderByDir === "desc" ? "desc" : "asc" }
        : { createdAt: "asc" };

    const result = await listAssignments({
      taskId,
      tagId,
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

/** Obtiene una asignación por su ID, opcionalmente con relaciones */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getAssignmentById(id, { include: include?.toString() });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/** Crea una o varias asignaciones de etiquetas a tareas */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }
    const result = await createAssignments(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/** Elimina una o varias asignaciones; requiere body.ids (query no permitido) */
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
    const result = await deleteAssignments(ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
