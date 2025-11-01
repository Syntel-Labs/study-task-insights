import { importBatch } from "#services/batchImportService.js";

/** Controlador para importar un batch de tasks, assignments y sessions */
export const importBatchCtrl = async (req, res, next) => {
  try {
    const result = await importBatch(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
