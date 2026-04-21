import * as sessionsRepo from "#repositories/studySessionsRepository.js";

const READ_ONLY_FIELDS = ["studySessionId", "createdAt", "durationMinutes"];

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

const ensure_valid_times = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) {
    const e = new Error("startedAt and endedAt are required");
    e.statusCode = 400;
    throw e;
  }
  const s = new Date(startedAt);
  const en = new Date(endedAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
    const e = new Error("Invalid dates in startedAt/endedAt");
    e.statusCode = 400;
    throw e;
  }
  if (en < s) {
    const e = new Error("endedAt must be greater than or equal to startedAt");
    e.statusCode = 400;
    throw e;
  }
};

const build_include = (include) => {
  const inc = {};
  if (include === "task" || include === "all" || include?.includes?.("task")) {
    inc.task = true;
  }
  return Object.keys(inc).length ? inc : undefined;
};

const build_where = ({ taskId, startedFrom, startedTo, endedFrom, endedTo, q }) => {
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
  if (q) where.notes = { contains: q, mode: "insensitive" };
  return where;
};

export const listSessions = async (params = {}) => {
  const {
    taskId, startedFrom, startedTo, endedFrom, endedTo, q,
    limit, offset, include, orderBy = { startedAt: "asc" },
  } = params;

  const where = build_where({ taskId, startedFrom, startedTo, endedFrom, endedTo, q });
  const inc = build_include(include);
  const { take, skip } = normalize_pagination(limit, offset);

  const [items, total] = await Promise.all([
    sessionsRepo.findMany({ where, include: inc, orderBy, take, skip }),
    sessionsRepo.count(where),
  ]);

  return { items, total };
};

export const getSessionById = async (id, { include } = {}) => {
  const inc = build_include(include);
  const item = await sessionsRepo.findById(id, inc);
  if (!item) {
    const err = new Error(`Study session not found: id=${id}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

export const createSessions = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map((r) => {
    ensure_valid_times(r.startedAt, r.endedAt);
    return strip_read_only(r);
  });

  try {
    const ops = sanitized.map((data) => sessionsRepo.create(data));
    const items = await sessionsRepo.transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2003") {
      const e = new Error("Foreign key violation. Check taskId.");
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

export const updateSessions = async (payload) => {
  const records = Array.isArray(payload) ? payload : [payload];
  if (!records.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const items = [];
  const notFoundIds = [];
  const conflictIds = [];

  await sessionsRepo.transaction(async () => {
    for (const data of records) {
      const id = String(data.studySessionId ?? "");
      if (!id) {
        const e = new Error("Missing studySessionId in update payload");
        e.statusCode = 400;
        throw e;
      }

      if (data.startedAt || data.endedAt) {
        const current = await sessionsRepo.findByIdSelect(id, { startedAt: true, endedAt: true });
        if (!current) { notFoundIds.push(id); return; }
        ensure_valid_times(data.startedAt ?? current.startedAt, data.endedAt ?? current.endedAt);
      }

      const updateData = strip_read_only({ ...data });
      delete updateData.studySessionId;

      try {
        const updated = await sessionsRepo.update(id, updateData);
        items.push(updated);
      } catch (err) {
        if (err.code === "P2025") { notFoundIds.push(id); return; }
        if (err.code === "P2003") {
          conflictIds.push({ id, message: "Foreign key violation. Check taskId.", target: err.meta?.target });
          return;
        }
        throw err;
      }
    }
  });

  return { count: items.length, items, notFoundIds, conflictIds };
};

export const deleteSessions = async (ids) => {
  const idArray = (Array.isArray(ids) ? ids : [ids]).map(String);

  const deletedIds = [];
  const notFoundIds = [];

  for (const id of idArray) {
    try {
      await sessionsRepo.remove(id);
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds };
};
