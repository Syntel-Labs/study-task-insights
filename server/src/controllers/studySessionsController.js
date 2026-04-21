import {
  listSessions,
  getSessionById,
  createSessions,
  updateSessions,
  deleteSessions,
} from "#services/studySessionsService.js";
import { ok, created, paginationMeta } from "#utils/response.js";

/** GET /api/v1/study-sessions */
export const getList = async (req, res, next) => {
  try {
    const {
      taskId,
      startedFrom,
      startedTo,
      endedFrom,
      endedTo,
      q,
      page,
      pageSize,
      include,
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
        : { startedAt: "asc" };

    const result = await listSessions({
      taskId,
      startedFrom,
      startedTo,
      endedFrom,
      endedTo,
      q: q?.toString(),
      limit: parsedPageSize,
      offset,
      include: include?.toString(),
      orderBy,
    });

    return ok(
      res,
      "study_session_list",
      result.items,
      paginationMeta(parsedPage, parsedPageSize, result.total)
    );
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/study-sessions/:id */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    const item = await getSessionById(id, { include: include?.toString() });
    return ok(res, "study_session_found", item);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/study-sessions */
export const createMany = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await createSessions(payload);
    return created(res, "study_session_created", result);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/study-sessions */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await updateSessions(payload);
    return ok(res, "study_session_updated", result);
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/study-sessions */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      const e = new Error("Invalid body: { ids: [...] } required");
      e.statusCode = 400;
      throw e;
    }
    const result = await deleteSessions(ids);
    return ok(res, "study_session_deleted", result);
  } catch (err) {
    return next(err);
  }
};
