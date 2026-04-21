import {
  listTasks,
  getTaskById,
  createTasks,
  updateTasks,
  deleteTasks,
} from "#services/tasksService.js";
import { ok, created, paginationMeta } from "#utils/response.js";

/** GET /api/v1/tasks */
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
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query;

    const parsedPage = page !== undefined ? Math.max(1, Number(page)) : 1;
    const parsedPageSize =
      pageSize !== undefined ? Math.min(200, Math.max(1, Number(pageSize))) : 50;
    const offset = (parsedPage - 1) * parsedPageSize;

    const orderBy =
      sortBy && sortOrder
        ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
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
      limit: parsedPageSize,
      offset,
      orderBy,
    });

    return ok(
      res,
      "task_list",
      result.items,
      paginationMeta(parsedPage, parsedPageSize, result.total)
    );
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/tasks/:id */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getTaskById(id, { include: include?.toString() });
    return ok(res, "task_found", item);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/tasks */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await createTasks(payload);
    return created(res, "task_created", result);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/tasks */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await updateTasks(payload);
    return ok(res, "task_updated", result);
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/tasks */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      const e = new Error("Invalid body: { ids: [...] } required");
      e.statusCode = 400;
      throw e;
    }
    const result = await deleteTasks(ids);
    return ok(res, "task_deleted", result);
  } catch (err) {
    return next(err);
  }
};
