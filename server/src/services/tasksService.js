import * as tasksRepo from "#repositories/tasksRepository.js";

const READ_ONLY_FIELDS = ["taskId", "createdAt", "updatedAt"];

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

const build_where = (filters = {}) => {
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
    const arr = Array.isArray(tagId) ? tagId : [tagId];
    const ids = [...new Set(arr.map(String))];
    if (ids.length) {
      where.tagAssignments = { some: { taskTagId: { in: ids } } };
    }
  }

  return where;
};

const build_include = (include) => {
  const wantsAll = include === "all";
  const wantsLookups = wantsAll || include?.includes("lookups");
  const wantsTags = wantsAll || include?.includes("tags");

  const inc = {};
  if (wantsLookups) {
    inc.status = true;
    inc.priority = true;
    inc.type = true;
    inc.term = true;
  }
  if (wantsTags) {
    inc.tagAssignments = { include: { tag: true } };
  }
  return Object.keys(inc).length ? inc : undefined;
};

export const listTasks = async (params = {}) => {
  const {
    q, limit, offset, statusId, priorityId, typeId, termId,
    tagId, dueFrom, dueTo, archived, include, orderBy = { dueAt: "asc" },
  } = params;

  const where = build_where({ q, statusId, priorityId, typeId, termId, tagId, dueFrom, dueTo, archived });
  const inc = build_include(include);
  const { take, skip } = normalize_pagination(limit, offset);

  const [items, total] = await Promise.all([
    tasksRepo.findMany({ where, include: inc, orderBy, take, skip }),
    tasksRepo.count(where),
  ]);

  return { items, total };
};

export const getTaskById = async (taskId, { include } = {}) => {
  const inc = build_include(include);
  const item = await tasksRepo.findById(taskId, inc);
  if (!item) {
    const err = new Error(`Task not found: id=${taskId}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

export const createTasks = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map(strip_read_only);

  try {
    const ops = sanitized.map((data) => tasksRepo.create(data));
    const items = await tasksRepo.transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error("Foreign key violation. Check catalog/term references.");
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    if (err.code === "P2002") {
      const target = err.meta?.target?.join(", ") ?? "unique index";
      const e = new Error(`Duplicate detected: active task with same title and academic term already exists (${target}).`);
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

export const updateTasks = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const items = [];
  const notFoundIds = [];
  const conflictIds = [];

  for (const data of records) {
    const rawId = data.taskId;
    if (!rawId) {
      const err = new Error("Missing taskId in update payload");
      err.statusCode = 400;
      throw err;
    }
    const id = String(rawId);
    const updateData = strip_read_only({ ...data });
    delete updateData.taskId;

    // Resolve flat IDs to Prisma relation syntax
    if (updateData.taskStatusId !== undefined) {
      updateData.status = { connect: { taskStatusId: Number(updateData.taskStatusId) } };
      delete updateData.taskStatusId;
    }
    if (updateData.taskPriorityId !== undefined) {
      updateData.priority = { connect: { taskPriorityId: Number(updateData.taskPriorityId) } };
      delete updateData.taskPriorityId;
    }
    if (updateData.taskTypeId !== undefined) {
      updateData.type = { connect: { taskTypeId: Number(updateData.taskTypeId) } };
      delete updateData.taskTypeId;
    }
    if ("termId" in updateData) {
      updateData.term =
        updateData.termId === null || updateData.termId === ""
          ? { disconnect: true }
          : { connect: { termId: Number(updateData.termId) } };
      delete updateData.termId;
    }

    try {
      const updated = await tasksRepo.update(id, updateData);
      items.push(updated);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      if (err.code === "P2002") {
        conflictIds.push({ id, message: "Uniqueness conflict: another active task with same title or date exists in the same term.", target: err.meta?.target });
        continue;
      }
      if (err.code === "P2003") {
        conflictIds.push({ id, message: "Foreign key violation. Check your references.", target: err.meta?.target });
        continue;
      }
      throw err;
    }
  }

  return { count: items.length, items, notFoundIds, conflictIds };
};

export const deleteTasks = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((x) => String(x));

  const deletedIds = [];
  const notFoundIds = [];
  const blockedIds = [];

  for (const id of idArray) {
    try {
      await tasksRepo.remove(id);
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      if (err.code === "P2003") { blockedIds.push(id); continue; }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds, blockedIds };
};
