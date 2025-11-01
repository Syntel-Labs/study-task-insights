import { Router } from "express";
import {
  getList,
  getOne,
  createMany,
  updateManyCtrl,
  deleteManyCtrl,
} from "#controllers/catalogsController.js";

const router = Router();

/**
 * Entidades soportadas(catáñlogos):
 *  - terms
 *  - task-statuses
 *  - task-priorities
 *  - task-types
 *  - task-tags
 */
router.get("/:entity", getList);
router.get("/:entity/:id", getOne);
router.post("/:entity", createMany);
router.put("/:entity", updateManyCtrl);
router.delete("/:entity", deleteManyCtrl);

export default router;
