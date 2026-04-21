import {
  listAssignments,
  getAssignmentById,
  createAssignments,
  deleteAssignments,
} from "#services/taskTagAssignmentsService.js";
import { ok, created, paginationMeta } from "#utils/response.js";

/** GET /api/v1/task-tag-assignments */
export const getList = async (req, res, next) => {
  try {
    const { taskId, tagId, page, pageSize, include, sortBy, sortOrder } =
      req.query;

    const parsedPage = page !== undefined ? Math.max(1, Number(page)) : 1;
    const parsedPageSize =
      pageSize !== undefined ? Math.min(200, Math.max(1, Number(pageSize))) : 50;
    const offset = (parsedPage - 1) * parsedPageSize;

    const orderBy =
      sortBy && sortOrder
        ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
        : { createdAt: "asc" };

    const result = await listAssignments({
      taskId,
      tagId,
      limit: parsedPageSize,
      offset,
      include: include?.toString(),
      orderBy,
    });

    return ok(
      res,
      "task_tag_assignment_list",
      result.items,
      paginationMeta(parsedPage, parsedPageSize, result.total)
    );
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/task-tag-assignments/:id */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getAssignmentById(id, { include: include?.toString() });
    return ok(res, "task_tag_assignment_found", item);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/task-tag-assignments */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await createAssignments(payload);
    return created(res, "task_tag_assignment_created", result);
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/task-tag-assignments */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      const e = new Error("Invalid body: { ids: [...] } required");
      e.statusCode = 400;
      throw e;
    }
    const result = await deleteAssignments(ids);
    return ok(res, "task_tag_assignment_deleted", result);
  } catch (err) {
    return next(err);
  }
};
