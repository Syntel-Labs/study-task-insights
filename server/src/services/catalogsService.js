import * as catalogsRepo from "#repositories/catalogsRepository.js";

const ENTITY_MAP = {
  terms: {
    idKey: "termId",
    orderBy: { name: "asc" },
    searchableFields: ["name"],
    readOnlyFields: ["termId", "createdAt", "updatedAt"],
  },
  "task-statuses": {
    idKey: "taskStatusId",
    orderBy: { code: "asc" },
    searchableFields: ["code", "description"],
    readOnlyFields: ["taskStatusId", "createdAt"],
  },
  "task-priorities": {
    idKey: "taskPriorityId",
    orderBy: { weight: "desc" },
    searchableFields: ["code"],
    readOnlyFields: ["taskPriorityId", "createdAt"],
  },
  "task-types": {
    idKey: "taskTypeId",
    orderBy: { code: "asc" },
    searchableFields: ["code", "description"],
    readOnlyFields: ["taskTypeId", "createdAt"],
  },
  "task-tags": {
    idKey: "taskTagId",
    orderBy: { name: "asc" },
    searchableFields: ["name", "color"],
    readOnlyFields: ["taskTagId", "createdAt"],
  },
};

export const ensureEntity = (entity) => {
  const meta = ENTITY_MAP[entity];
  if (!meta) {
    const err = new Error(`Unsupported catalog: ${entity}`);
    err.statusCode = 400;
    throw err;
  }
  const model = catalogsRepo.modelFor(entity);
  return { ...meta, model };
};

const parse_id = (entity, raw) => {
  if (entity === "task-tags") return String(raw);
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    const err = new Error(`Invalid ID: ${raw}`);
    err.statusCode = 400;
    throw err;
  }
  return n;
};

const strip_read_only = (data, readOnlyFields) => {
  const d = { ...data };
  for (const k of readOnlyFields) delete d[k];
  return d;
};

export const listCatalog = async (entity, { q, limit, offset }) => {
  const { model, orderBy, searchableFields = [] } = ensureEntity(entity);

  const where =
    q && searchableFields.length
      ? { OR: searchableFields.map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) }
      : undefined;

  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;

  const [items, total] = await Promise.all([
    catalogsRepo.findMany(model, { where, orderBy, take, skip }),
    catalogsRepo.count(model, where),
  ]);

  return { items, total };
};

export const getCatalogById = async (entity, id) => {
  const { model, idKey } = ensureEntity(entity);
  const item = await catalogsRepo.findById(model, idKey, parse_id(entity, id));
  if (!item) {
    const err = new Error(`Not found: id=${id}`);
    err.statusCode = 404;
    throw err;
  }
  return item;
};

export const createCatalog = async (entity, payload) => {
  const { model, readOnlyFields = [] } = ensureEntity(entity);
  const records = Array.isArray(payload) ? payload : [payload];

  if (records.length === 0) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map((r) => strip_read_only(r, readOnlyFields));

  try {
    const ops = sanitized.map((data) => catalogsRepo.create(model, data));
    const items = await catalogsRepo.transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    if (err.code === "P2002") {
      const e = new Error("Duplicate: a record with these unique values already exists.");
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

export const updateCatalog = async (entity, payload) => {
  const { model, idKey, readOnlyFields = [] } = ensureEntity(entity);
  const records = Array.isArray(payload) ? payload : [payload];

  if (records.length === 0) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  const items = [];
  const notFoundIds = [];
  const conflictIds = [];

  for (const data of records) {
    const rawId = data[idKey];
    if (rawId === undefined || rawId === null) {
      const err = new Error(`Missing ${idKey} in update payload`);
      err.statusCode = 400;
      throw err;
    }

    const id = parse_id(entity, rawId);
    const updateData = strip_read_only({ ...data }, readOnlyFields);
    delete updateData[idKey];

    try {
      const updated = await catalogsRepo.update(model, idKey, id, updateData);
      items.push(updated);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      if (err.code === "P2002") { conflictIds.push({ id, target: err.meta?.target }); continue; }
      throw err;
    }
  }

  return { count: items.length, items, notFoundIds, conflictIds };
};

export const deleteCatalog = async (entity, ids) => {
  const { model, idKey } = ensureEntity(entity);
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((id) => parse_id(entity, id));

  const deletedIds = [];
  const notFoundIds = [];
  const blockedIds = [];

  for (const id of idArray) {
    try {
      await catalogsRepo.remove(model, idKey, id);
      deletedIds.push(id);
    } catch (err) {
      if (err.code === "P2025") { notFoundIds.push(id); continue; }
      if (err.code === "P2003") { blockedIds.push(id); continue; }
      throw err;
    }
  }

  return { count: deletedIds.length, deletedIds, notFoundIds, blockedIds };
};
