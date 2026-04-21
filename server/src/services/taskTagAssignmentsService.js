import * as assignmentsRepo from "#repositories/taskTagAssignmentsRepository.js";

const READ_ONLY_FIELDS = ["taskTagAssignmentId", "createdAt"];

const strip_read_only = (data) => {
  const d = { ...data };
  for (const k of READ_ONLY_FIELDS) delete d[k];
  return d;
};

const normalize_pagination = (limit, offset) => {
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;
  return { take, skip };
};

const build_include = (include) => {
  const wantsAll = include === "all";
  const wantsTask = wantsAll || include?.includes("task");
  const wantsTag = wantsAll || include?.includes("tag");
  const inc = {};
  if (wantsTask) inc.task = true;
  if (wantsTag) inc.tag = true;
  return Object.keys(inc).length ? inc : undefined;
};

const build_where = ({ taskId, tagId }) => {
  const where = {};
  if (taskId) where.taskId = String(taskId);
  if (tagId) where.taskTagId = String(tagId);
  return where;
};

export const listAssignments = async (params = {}) => {
  const { taskId, tagId, limit, offset, include, orderBy = { createdAt: "asc" } } = params;

  const where = build_where({ taskId, tagId });
  const inc = build_include(include);
  const { take, skip } = normalize_pagination(limit, offset);

  const [items, total] = await Promise.all([
    assignmentsRepo.findMany({ where, include: inc, orderBy, take, skip }),
    assignmentsRepo.count(where),
  ]);

  return { items, total };
};

export const getAssignmentById = async (id, { include } = {}) => {
  const inc = build_include(include);
  const item = await assignmentsRepo.findById(id, inc);
  if (!item) {
    const err = new Error(`Assignment not found: id=${id}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

export const createAssignments = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map(strip_read_only);

  try {
    const ops = sanitized.map((data) => assignmentsRepo.create(data));
    const items = await assignmentsRepo.transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error("Foreign key violation. Check taskId and taskTagId.");
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    if (err.code === "P2002") {
      const e = new Error("Duplicate: this tag is already assigned to the task (taskId + taskTagId).");
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

export const deleteAssignments = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((x) => String(x));

  const deletedIds = [];
  const notFoundIds = [];

  for (const id of idArray) {
    try {
      await assignmentsRepo.remove(id);
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds };
};
