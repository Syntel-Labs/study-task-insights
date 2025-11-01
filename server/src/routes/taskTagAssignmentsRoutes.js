import { Router } from "express";
import {
  getList,
  getOne,
  createMany,
  deleteManyCtrl,
} from "#controllers/taskTagAssignmentsController.js";

const router = Router();

router.get("/", getList);
router.get("/:id", getOne);
router.post("/", createMany);
router.delete("/", deleteManyCtrl);

export default router;
