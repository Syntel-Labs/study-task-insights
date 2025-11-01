import {
  listCatalog,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} from "#services/catalogsService.js";

/* obtiene listado de un catálogo según entidad */
export const getList = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const { q, limit, offset } = req.query;

    // pasa los parámetros de búsqueda y paginación al servicio
    const result = await listCatalog(entity, {
      q: q?.toString(),
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* obtiene un registro individual del catálogo */
export const getOne = async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const item = await getCatalogById(entity, id);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/* crea uno o varios registros */
export const createMany = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const payload = req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }

    // delega la creación al servicio
    const result = await createCatalog(entity, payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/* actualiza uno o varios registros (cada objeto debe tener su ID) */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const payload = req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Body vacío");
      e.statusCode = 400;
      throw e;
    }

    const result = await updateCatalog(entity, payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* elimina varios registros del catálogo */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    const { entity } = req.params;

    // se evita usar query ?ids=...
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

    const result = await deleteCatalog(entity, ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
