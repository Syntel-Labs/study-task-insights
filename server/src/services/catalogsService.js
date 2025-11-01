import prisma from "#config/prismaClient.js";

/**
 * Mapa de definición por entidad.
 * Cada entrada indica cómo Prisma debe manejar esa tabla.
 */
const ENTITY_MAP = {
  terms: {
    model: prisma.term,
    idKey: "termId",
    orderBy: { name: "asc" },
    searchableFields: ["name"],
    readOnlyFields: ["termId", "createdAt", "updatedAt"],
  },
  "task-statuses": {
    model: prisma.taskStatus,
    idKey: "taskStatusId",
    orderBy: { code: "asc" },
    searchableFields: ["code", "description"],
    readOnlyFields: ["taskStatusId", "createdAt"],
  },
  "task-priorities": {
    model: prisma.taskPriority,
    idKey: "taskPriorityId",
    orderBy: { weight: "desc" },
    searchableFields: ["code"],
    readOnlyFields: ["taskPriorityId", "createdAt"],
  },
  "task-types": {
    model: prisma.taskType,
    idKey: "taskTypeId",
    orderBy: { code: "asc" },
    searchableFields: ["code", "description"],
    readOnlyFields: ["taskTypeId", "createdAt"],
  },
  "task-tags": {
    model: prisma.taskTag,
    idKey: "taskTagId",
    orderBy: { name: "asc" },
    searchableFields: ["name", "color"],
    readOnlyFields: ["taskTagId", "createdAt"],
  },
};

/**
 * Verifica que la entidad exista en el mapa configurado.
 * Si no está definida, lanza un error controlado.
 */
export const ensureEntity = (entity) => {
  const meta = ENTITY_MAP[entity];
  if (!meta) {
    const err = new Error(`Catálogo no soportado: ${entity}`);
    err.statusCode = 400;
    throw err;
  }
  return meta;
};

/**
 * Convierte el ID al tipo correcto según la entidad (task-tags), los demás son enteros.
 */
const parseId = (entity, raw) => {
  if (entity === "task-tags") return String(raw); // UUID

  const n = Number(raw);
  if (!Number.isInteger(n)) {
    const err = new Error(`ID inválido: ${raw}`);
    err.statusCode = 400;
    throw err;
  }
  return n;
};

/**
 * Elimina los campos de solo lectura antes de operaciones de escritura.
 */
const stripReadOnly = (data, readOnlyFields) => {
  const d = { ...data };
  for (const k of readOnlyFields) delete d[k];
  return d;
};

/**
 * Retorna una lista paginada y filtrada opcionalmente por texto.
 * Permite buscar sobre campos configurados en `searchableFields`.
 */
export const listCatalog = async (entity, { q, limit, offset }) => {
  const { model, orderBy, searchableFields = [] } = ensureEntity(entity);

  // genera condición OR para campos buscables si hay query "q"
  const where =
    q && searchableFields.length
      ? {
          OR: searchableFields.map((f) => ({
            [f]: { contains: q, mode: "insensitive" },
          })),
        }
      : undefined;

  // límites de paginación
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;

  const [items, total] = await Promise.all([
    model.findMany({ where, orderBy, take, skip }),
    model.count({ where }),
  ]);

  return { items, total };
};

/**
 * Obtiene un registro específico por su ID.
 * Lanza error 404 si no existe.
 */
export const getCatalogById = async (entity, id) => {
  const { model, idKey } = ensureEntity(entity);
  const item = await model.findUnique({
    where: { [idKey]: parseId(entity, id) },
  });

  if (!item) {
    const err = new Error(`No encontrado id=${id}`);
    err.statusCode = 404;
    throw err;
  }

  return item;
};

/**
 * Crea uno o varios registros nuevos. Lanza error si hay duplicado.
 */
export const createCatalog = async (entity, payload) => {
  const { model, readOnlyFields = [] } = ensureEntity(entity);
  const records = Array.isArray(payload) ? payload : [payload];

  if (records.length === 0) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const sanitized = records.map((r) => stripReadOnly(r, readOnlyFields));

  try {
    // se usan creates individuales dentro de una transacción para obtener los items
    const ops = sanitized.map((data) => model.create({ data }));
    const items = await prisma.$transaction(ops);
    return { count: items.length, items };
  } catch (err) {
    // Prisma P2002 = constraint de unicidad
    if (err.code === "P2002") {
      const e = new Error(
        "Duplicado: ya existe un registro con valores únicos."
      );
      e.statusCode = 409;
      e.details = err.meta;
      throw e;
    }
    throw err;
  }
};

/**
 * Actualiza uno o varios registros.
 * Cada objeto debe incluir su ID correspondiente.
 */
export const updateCatalog = async (entity, payload) => {
  const { model, idKey, readOnlyFields = [] } = ensureEntity(entity);
  const records = Array.isArray(payload) ? payload : [payload];

  if (records.length === 0) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  const items = [];
  const notFoundIds = [];
  const conflictIds = [];

  for (const data of records) {
    const rawId = data[idKey];
    if (rawId === undefined || rawId === null) {
      const err = new Error(`Falta ${idKey} en update`);
      err.statusCode = 400;
      throw err; // error de contrato
    }

    const id = parseId(entity, rawId);
    const updateData = stripReadOnly({ ...data }, readOnlyFields); // limpia campos de solo lectura antes de actualizar
    delete updateData[idKey];

    try {
      const updated = await model.update({
        where: { [idKey]: id },
        data: updateData,
      });
      items.push(updated);
    } catch (err) {
      if (err.code === "P2025") {
        notFoundIds.push(id); // registro no existe
        continue;
      }
      if (err.code === "P2002") {
        conflictIds.push({ id, target: err.meta?.target }); // no es único
        continue;
      }
      throw err; // otros errores
    }
  }

  return { count: items.length, items, notFoundIds, conflictIds };
};

/**
 * Elimina uno o varios registros pasados por body.ids.
 */
export const deleteCatalog = async (entity, ids) => {
  const { model, idKey } = ensureEntity(entity);
  const idArray = (Array.isArray(ids) ? ids : [ids]).map((id) =>
    parseId(entity, id)
  );

  const deletedIds = [];
  const notFoundIds = [];
  const blockedIds = []; // por restricciones de FK

  // Ejecuta uno por uno para poder clasificar resultados
  for (const id of idArray) {
    try {
      await model.delete({ where: { [idKey]: id } });
      deletedIds.push(id);
    } catch (err) {
      // P2025: no encontrado
      if (err.code === "P2025") {
        notFoundIds.push(id);
        continue;
      }
      // P2003: restricción FK
      if (err.code === "P2003") {
        blockedIds.push(id);
        continue;
      }
      throw err;
    }
  }

  return {
    count: deletedIds.length,
    deletedIds,
    notFoundIds,
    blockedIds,
  };
};
