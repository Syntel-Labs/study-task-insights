import {
  listCatalog,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} from "#services/catalogsService.js";
import { ok, created, paginationMeta } from "#utils/response.js";

/** GET /api/v1/catalogs/:entity */
export const getList = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const { q, page, pageSize } = req.query;

    const parsedPage = page !== undefined ? Math.max(1, Number(page)) : 1;
    const parsedPageSize =
      pageSize !== undefined ? Math.min(200, Math.max(1, Number(pageSize))) : 50;
    const offset = (parsedPage - 1) * parsedPageSize;

    const result = await listCatalog(entity, {
      q: q?.toString(),
      limit: parsedPageSize,
      offset,
    });

    return ok(
      res,
      "catalog_list",
      result.items,
      paginationMeta(parsedPage, parsedPageSize, result.total)
    );
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/catalogs/:entity/:id */
export const getOne = async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const item = await getCatalogById(entity, id);
    return ok(res, "catalog_found", item);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/catalogs/:entity */
export const createMany = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await createCatalog(entity, payload);
    return created(res, "catalog_created", result);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/v1/catalogs/:entity */
export const updateManyCtrl = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      const e = new Error("Empty body");
      e.statusCode = 400;
      throw e;
    }
    const result = await updateCatalog(entity, payload);
    return ok(res, "catalog_updated", result);
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/v1/catalogs/:entity */
export const deleteManyCtrl = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      const e = new Error("Invalid body: { ids: [...] } required");
      e.statusCode = 400;
      throw e;
    }
    const result = await deleteCatalog(entity, ids);
    return ok(res, "catalog_deleted", result);
  } catch (err) {
    return next(err);
  }
};
