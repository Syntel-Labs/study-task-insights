import { Router } from "express";
import { importBatchCtrl } from "#controllers/batchImportController.js";

const router = Router();

router.post("/", importBatchCtrl);

export default router;
