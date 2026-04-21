import { importBatch } from "#services/batchImportService.js";
import { created } from "#utils/response.js";

/** POST /api/v1/import/batch */
export const importBatchCtrl = async (req, res, next) => {
  try {
    const result = await importBatch(req.body);
    return created(res, "import_batch_created", result);
  } catch (err) {
    return next(err);
  }
};
